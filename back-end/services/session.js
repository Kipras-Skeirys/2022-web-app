const status = require('./status')
const chat = require('./chat')
const searching = require('./searching')
const { usersCache, inSessionCache, connectingCache } = require('../server')
const webRTC = require('./webRTC')
const { v4: uuidv4 } = require('uuid')
const { app } = require('../server')
const io = app.get('socketio')
const Connecting_log = require('../models/connecting_log')
const In_session_log = require('../models/in_session_log')


module.exports.start = function (uid1, uid2) {

    const sid = uuidv4()
    let sessionStartPromiseReject
    
    const start_time = Date.now()
    const Connecting_log_promise = Connecting_log.create({
        status: 'connecting',
        sid,
        start_time
    })

    const u1 = usersCache.get(uid1)
    const u2 = usersCache.get(uid2)
    
    function matchFoundEmit(callback) {
        
        if (!u2) {
            searching.remove(u2.uid, 'error')
            usersCache.delete(u2.uid)
            searching.findMatch(u1.uid, u1.matching_pref)
        } else {
            function matchEmit(user_id, user_socket_id, partner_id) {
                return new Promise((resovle, reject) => {
                    io.to(user_socket_id).timeout(10000).emit('match-found', { partner_id, user_id }, (err, callback) => {
                        if (err) {
                            console.log(`[searching.start] [match-found] [err] User: ${user_id} | user_socket_id: ${user_socket_id} | Error: ${err}`)
                            reject(user_id)
                        } else {
                            if (callback.length && callback[0].status === 'ok') {
                                resovle()
                            } else {
                                console.log(`[session.start] [match-found] [callback.status !== 'ok'] User: ${user_id} | user_socket_id: ${user_socket_id}`)
                                reject(user_id)
                            }
                        }
                    })
                })
            }
        
            const promise1 = matchEmit(u1.uid, u1.user_socket_id, u2.uid)
            const promise2 = matchEmit(u2.uid, u2.user_socket_id, u1.uid)
            Promise.all([promise1, promise2]).then(() => {

                // Both users are ready to start connect
                searching.remove(u1.uid, 'match_found')
                searching.remove(u2.uid, 'match_found')
                return callback()
    
            }, (uid_rejected) => {
                const switchFn = (u1, u2) => {
                    // u1 - reject, u2 - searching reset
                    searching.remove(u1.uid, 'error')
                    io.to(u1.user_socket_id).timeout(10000).emit('hard-reset')
                    io.to(u2.user_socket_id).timeout(10000).emit('searching-reset')
                }
                u1.uid === uid_rejected ? switchFn(u1, u2) : switchFn(u2, u1)
                console.log(`[FAILURE] [searching.findMatch] [emit('match-found)] uid_rejected: ${uid_rejected}`)
            })
        }

    }
    
    const sessionStartPromise = new Promise((promiseResolve, promiseReject) => {

        sessionStartPromiseReject = promiseReject

        matchFoundEmit(() => {
            webRTC.connect(u1, u2).then(() => {
                // Connected
                promiseResolve()
            }).catch((err) => {
                // Promise rejected / Error
                promiseReject({
                    err: `[FAILED] [session.start] [webRTC.connect] err: ${err}`,
                    failCode: 2
                })
            })

        })


    })

    function connectingFail() {
        connectingCache.delete(uid1)
        connectingCache.delete(uid2)
        const end_time = Date.now()
        Connecting_log_promise.then(() => {
            Connecting_log.findOneAndUpdate( { sid } , { status: 'failed', end_time }, (err, doc) => { if (err) { console.log(err) } })
        })
    }

    sessionStartPromise.then(() => {

        // On success
        inSessionCache.set(sid, {
            sid,
            uid1,
            uid2,
            start_time: Date.now()
        })

        status.in_session(uid1)
        status.in_session(uid2)
        chat.createRoom(u1, u2, sid)
        connectingCache.delete(uid1)
        connectingCache.delete(uid2)

        const end_time = Date.now()

        Connecting_log_promise.then(() => {
            Connecting_log.findOneAndUpdate( { sid } , { status: 'successful', end_time }, (err, doc) => { if (err) { console.log(err) } })
        })

        In_session_log.create({
            sid,
            users: {
                u1: {
                    uid: u1.uid,
                    uip: u1.uip,
                    matching_pref: u1.matching_pref
                },
                u2: {
                    uid: u2.uid,
                    uip: u2.uip,
                    matching_pref: u2.matching_pref
                }
            },
            start_time: end_time,
        })

    }, (data) => {
        // On fail

        // failCode 1 - connecting with user that doesn't exists
        // failCode 2 - failed to establish webRTC connection. Reseting search for both users
        // failCode 3 - user canceled connection. Reseting search for other user
        connectingFail()
        switch (data.failCode){
            case 1:
                return [ { err: 'Internal Server Error: failed to start the session' }, 500 ]
            case 2:
                io.to(u2.user_socket_id).emit('searching-reset')
                io.to(u1.user_socket_id).emit('searching-reset')
                break
            case 3:
                data.uid === uid1 ? io.to(u2.user_socket_id).emit('searching-reset') : io.to(u1.user_socket_id).emit('searching-reset')
                break
        }

    })

    // Add to connecting
    connectingCache.set(uid1, sessionStartPromiseReject)
    connectingCache.set(uid2, sessionStartPromiseReject)


}

module.exports.end = async function (uid, data) {

    let u1
    let u2
    let sid
    let partner_data

    const end_time = Date.now()

    if (connectingCache.has(uid)) {

        const promiseReject = connectingCache.get(uid)
        if (promiseReject) {
            promiseReject({
                err: `[CANCELED] [session.start] [connection canceled by user] uid: ${uid}`,
                failCode: 3,
                uid
            })
        }

    } else {

        try {
            inSessionCache.find((value, key) => {
                if ([value.uid1, value.uid2].includes(uid)) {
                    sid = key
                    inSessionCache.delete(key)
                    if (value.uid1 === uid) {
                        u1 = usersCache.get(value.uid1)
                        u2 = usersCache.get(value.uid2)
                    } else {
                        u2 = usersCache.get(value.uid1)
                        u1 = usersCache.get(value.uid2)
                    }
                    return true
                }
            })
            if (u1 && u2) {
                try {
                    status.online(u1.uid)
                    status.online(u2.uid)
                    chat.chatAnnounceTo(u1.user_socket_id, 'You have ended the session')
                    chat.chatAnnounceTo(u2.user_socket_id, 'Partner has ended the session')
                    const ended_by = u1.uid
                    io.to(u1.user_socket_id).timeout(10000).emit('in_session_end', ended_by, (err, callback) => { })
                    const u2DataPromise = new Promise((resolve, reject) => {
                        io.to(u2.user_socket_id).timeout(10000).emit('in_session_end', ended_by, (err, callback) => {
                            if (err) {
                                resolve()
                            } else {
                                if (callback && callback[0] && callback[0].bytesIO && callback[0].candidates) {
                                    partner_data = {
                                        ...callback[0].bytesIO,
                                        ...callback[0].candidates
                                    }
                                }
                                resolve()
                            }
                        })
                    })
                    chat.destroyRoom(sid, u1.uid)
                    webRTC.close(u1.user_socket_id, u2.user_socket_id)
                    
                    u2DataPromise.then(() => {

                        In_session_log.findOne( { sid, $or: [ { end_time: { $exists: false } }, { end_time: { $eq: null } } ] }, (err, doc) => {
                            if (!err) {
                                let databaseU1
                                let databaseU2
                                const correctOrder = doc.users.u1.uid === uid
                                databaseU1 = {
                                    uid: doc.users.u1.uid,
                                    uip: doc.users.u1.uip,
                                    matching_pref: doc.users.u1.matching_pref,
                                    webrtc_data: correctOrder ? data : partner_data
                                }
                                databaseU2 = {
                                    uid: doc.users.u2.uid,
                                    uip: doc.users.u2.uip,
                                    matching_pref: doc.users.u2.matching_pref,
                                    webrtc_data: !correctOrder ? data : partner_data
                                }
                                In_session_log.findOne( { sid, $or: [ { end_time: { $exists: false } }, { end_time: { $eq: null } } ] }  ).updateOne({
                                    users: {
                                        u1: databaseU1,
                                        u2: databaseU2
                                    },
                                    end_time,
                                    ended_by: uid,
                                }, (err) => { if (err) { console.log(err) } })
                            } else {
                                In_session_log.findOne( { sid, $or: [ { end_time: { $exists: false } }, { end_time: { $eq: null } } ] }  ).updateOne({
                                    end_time,
                                    ended_by: uid,
                                }, (err) => { if (err) { console.log(err) } })
                            }
                        })

                    })
                    
                    return 'ok'
                } catch(err) {
                    console.log(`[FAILED] [session.end] [general] ERROR: ${err}`)
                    return 'ok'
                }
            } else {
                console.log(`[ERROR] [session.end] [undefined: u1 && u2] ERROR: u1:${u1}, u2:${u2}`)
            }
    
        }catch(err) {
            console.log(`[FAILED] [session.end] [inSessionCache.find] ERROR: ${err}`)
            return 'ok'
        }

    }


}