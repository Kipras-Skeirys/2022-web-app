require('dotenv').config()

const express = require('express')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const http = require('http')
const cors = require('cors')
const path = require('path')
const LRU = require('lru-cache')
const mongoose = require('mongoose')
const requestIp = require('request-ip')
const { ProfilingIntegration } =  require("@sentry/profiling-node")

const { getIceCredentials } = require('./api/turnAPI')

module.exports.app = app = express()


// Memory cache
    const cacheOptions = {
        max: parseInt(process.env.LRU_CACHE_OPTIONS_MAX), // Max pairs
        maxSize: parseInt(process.env.LRU_CACHE_OPTIONS_MAXSIZE), // Max size in bytes
        ttl: 43200000, // 12hours
        sizeCalculation: (value, key) => {
            if (value) {
                return Buffer.byteLength(JSON.stringify(value) + JSON.stringify(key))
            } else {
                return Buffer.byteLength(JSON.stringify(key))
            }
        }
    }

    // Bigest size of single key/value pair for `searchingCache`:
    // 187 bytes
    module.exports.searchingCache = searchingCache = new LRU(cacheOptions)
    // Size of single key/value pair for `inSessionCache` is constant(until next unix time digit):
    // 156 bytes
    module.exports.inSessionCache = inSessionCache = new LRU(cacheOptions)
    // Bigest size of single key/value pair for `usersCache`:
    // 201 bytes
    module.exports.usersCache = usersCache = new LRU(cacheOptions)
    // Size of single key for `doNotMatchCache` is constant:
    // 45 bytes

    module.exports.skipHistoryCache = skipHistoryCache = new LRU(cacheOptions)
    module.exports.failHistoryCache = failHistoryCache = new LRU(cacheOptions)

    cacheOptions.ttl = 30000 // 30seconds
    module.exports.doNotMatchCache = doNotMatchCache = new LRU(cacheOptions)
    module.exports.connectingCache = connectingCache = new LRU(cacheOptions)

    

// - - - - //



app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        const ip_whitelist = []
        if (ip_whitelist.includes(requestIp.getClientIp(req))) {
            next()
        } else {
            console.log(`[NOTICE] [ip_whitelist] redirecting user_ip: ${requestIp.getClientIp(req)}`)
            res.redirect(403, 'https://demo.com')
        }
    } else {
        next()
    }
})

// Return static front-end build
app.use(express.static(path.join(__dirname, '..', 'build')))


const server = http.createServer(app)


// Express-session

    const expressSessionAge = 86400000 // 24hours

    module.exports.sessionStore = sessionStore = new MemoryStore({
        checkPeriod: expressSessionAge
    })

    const sessionMiddleware = session({
        secret: process.env.SESSION_SECRET,
        cookie: { maxAge: expressSessionAge },
        saveUninitialized: true, // false
        resave: false, // false
        store: sessionStore
    })

    app.use(sessionMiddleware)

// - - - - //



// SOCKET IO //

    const io = new Server(server, {
        allowRequest: (req, callback) => {
            const fakeRes = {
            getHeader() {
                return []
            },
            setHeader(key, values) {
                req.cookieHolder = values[0]
            },
            writeHead() {},
            };
            sessionMiddleware(req, fakeRes, () => {
            if (req.session) {
                fakeRes.writeHead()
                req.session.save()
            }
                callback(null, true)
            })
        },
        cors: {
        origin: [
            process.env.ORIGIN
        ],
        methods: ['GET', 'POST']
        }
    })

    io.engine.on("initial_headers", (headers, req) => {
        if (req.cookieHolder) {
        headers["set-cookie"] = req.cookieHolder;
        delete req.cookieHolder;
        }
    })

    app.set('socketio', io)

    const sessionService = require('./services/session')
    const searchingService = require('./services/searching')

    // Update user count
    let randomNum = Math.floor(Math.random() * (70 - 40) + 40)
    function countUniqueUsers() {
        if (5 <= new Date().getUTCHours() && new Date().getUTCHours() <= 16) {
            return io.engine.clientsCount
        } else {
            return io.engine.clientsCount + randomNum
        }
    }
      
    setInterval(() => {
        io.emit('userCountUpdate', countUniqueUsers())
    }, 30000)

    setInterval(() => {
        randomNum = Math.floor(Math.random() * (70 - 40) + 40)
    }, 60 * 60 * 1000)




    io.on('connection', async (socket) => {

        // Save socket.id to Express Session
        socket.request.session.reload((err) => {
            if (err) {
                console.log(`[ERR] [socketIO] [on.connection] [socket.request.session.reload] error: ${err}`)
                return socket.disconnect()
                // emit that the socket.id not saved to express session
            }
            socket.request.session.user_socket_id = socket.id
            socket.request.session.save()
            // emit that socket.id saved 
        })

        // User count
        socket.emit('userCountUpdate', countUniqueUsers())
        socket.on('getUserCountUpdate', () => {
            return countUniqueUsers()
        })
        
        
        // WebRTC Signaling
        socket.on('webRTC_getIceCredentials', async (callback) => {
            try {
                const iceCredentials = await getIceCredentials(socket.request.headers['cf-ipcountry'] || null)
                callback(iceCredentials)
            } catch (e) { console.log(`[ERR] [turnAPI.getIceCredentials] error: ${e}`) }
        })


        // Update user_socket_id to cache
        if (socket.request.session.uid) {
            try {
                const obj = usersCache.get(socket.request.session.uid)
                if (obj.user_socket_id !== socket.id) {
                    obj.user_socket_id = socket.id
                    usersCache.set(socket.request.session.uid, obj)
                }
            } catch(err) {
                console.log(`[ERROR] [io.on.connection] [update user_socket_id]: uid: ${socket.request.session.uid} | user_socket_id: ${socket.id} | err: ${err}`)
            }
        }
        
        socket.on('message', (message) => {
            let rooms = Array.from(socket.rooms)
            if (rooms.length <= 2) {
                socket.to(rooms.pop()).emit('message', message)
            } else {
                socket.to(rooms.pop()).emit('message', message)
                console.log(`[ERR] [socket.connection] [on.message] [To many rooms] socket_id: ${socket.id}`)
            }
        })

        socket.on('typing', () => {
            let rooms = Array.from(socket.rooms)
            if (rooms.length <= 2) {
                socket.to(rooms.pop()).emit('typing')
            } else {
                socket.to(rooms.pop()).emit('typing')
                console.log(`[ERR] [socket.connection] [on.typing] [To many rooms] socket_id: ${socket.id}`)
            }
        })


        // On disconnect
        socket.on('disconnect', () => {

            this.usersCache.find((value) => {
                if (value.user_session_id === socket.request.session.id) {
                    
                    const user = value

                    // Remove from searching
                    if (this.searchingCache.has(user.uid)) {
                        searchingService.remove(user.uid, 'stop')
                    }

                    // Remove from connecting
                    if (this.connectingCache.has(user.uid)) {
                        sessionService.end(value.uid)
                    }
                    
            
                    // Session disconnect
                    this.inSessionCache.find((value, key) => {
                        if ([value.uid1, value.uid2].includes(user.uid)) {
                            value.uid1 === user.uid ? sessionService.end(value.uid1) : sessionService.end(value.uid2)
                            return
                        }
                    })

                    return

                }
            })
        })
    })
    
// - - - - //
    
    
// Routes //

    const sessionSetupRoute = require('./routes/sessionSetup')
    const searchingRoute = require('./routes/searching')
    const sessionRoute = require('./routes/inSession')

    app.use('/api/session-settings', sessionSetupRoute)
    app.use('/api/searching', searchingRoute)
    app.use('/api/inSession', sessionRoute)

// - - - - //


// On load/reload redirect to root
app.set('trust proxy', true);

app.use('/*',  (req, res) => {
    if (req.headers.host.slice(0, 4) === 'www.') {
        let newHost = req.headers.host.slice(4);
        res.set({
            'Location': req.protocol + '://' + newHost + req.originalUrl
        })
        res.redirect(301, req.protocol + '://' + newHost + req.originalUrl)
    } else {
        res.sendFile(path.join(__dirname, '..', 'build', 'index.html'))
    }
})

app.use(Sentry.Handlers.errorHandler())
app.use(function onError(err, req, res, next) {
    res.statusCode = 500;
    res.end(res.sentry + "\n")
})

mongoose.set("strictQuery", false)
mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_DB
    })
    .then(() => {
        server.listen(process.env.PORT || 8000, () => {
            console.log(`App is listening on port: ${process.env.PORT || 8000}`)
        })
    })
    .catch((error) => console.log(error))

