const status = require('./status')
const session = require('./session')
const { app } = require('../server')
const { searchingCache, usersCache, doNotMatchCache, skipHistoryCache } = require('../server')
const { v4: uuidv4 } = require('uuid')
const Searching_log = require('../models/searching_log')

const io = app.get('socketio')

module.exports.remove = function (uid, reason) {

    searchingCache.delete(uid)
    Searching_log.findOne( { uid, $or: [ { end_time: { $exists: false } }, { end_time: { $eq: null } } ] }  ).sort( { start_time: -1} ).updateOne(
        {
            end_time: Date.now(),
            end_reason: reason
        }, (err) => { if (err) { console.log(err) }
    })

    return 'ok'
}

module.exports.add = function (uid, matching_pref) {
    
    const start_time = Date.now()
    searchingCache.set(uid, matching_pref)
    status.searching(uid)
    const u = usersCache.get(uid)
    
    // Clear any socket.io rooms
    const socket = io.sockets.sockets.get(u.user_socket_id)
    const rooms = socket.rooms
    rooms.forEach((room) => {
        if (room !== socket.id) {
            socket.leave(room)
        }
    })

    Searching_log.create({
        uip: usersCache.get(uid) ? usersCache.get(uid).uip : null,
        uid,
        matching_pref,
        start_time
    })

    this.findMatch(uid, matching_pref)

    return 'ok'
}

module.exports.findMatch = function (uid, matching_pref) {

    const { user_selection1, user_selection2, partner_selection1, partner_selection2 } = matching_pref
    
    let partner_id
    for (const match of searchingCache.rentries()) {
        const [ match_id, { user_selection1: match_selection1, user_selection2: match_selection2, partner_selection1: match_pref_selection1, partner_selection2: match_pref_selection2 } ] = match
        if (!doNotMatchCache.has(match_id)) {
            
            if (
                match_pref_selection1.includes(user_selection1) &&
                match_pref_selection2.includes(user_selection2) &&
                partner_selection1.includes(match_selection1) &&
                partner_selection2.includes(match_selection2) &&
                match_id !== uid
            ){
                const skipHistory = skipHistoryCache.find(value => [match_id, uid].every(uid => value.uids.includes(uid)))

                if ((process.env.NODE_ENV === 'development' || skipHistory && skipHistory.skipCount < 2) || !skipHistory) {

                    const cacheID = skipHistory ? skipHistory.cacheID : uuidv4()

                    skipHistoryCache.set(cacheID, {
                        cacheID,
                        uids: skipHistory ? skipHistory.uids : [uid, match_id],
                        skipCount: skipHistory ? skipHistory.skipCount + 1 : 1
                    })
                    
                    // MATCH FOUND
                    partner_id = match_id
                    session.start(uid, partner_id)
                    break
                }
            }
        }
    }

    if (!partner_id) {
        return null
    }

}