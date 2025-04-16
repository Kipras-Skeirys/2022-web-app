const express = require('express')
const sessionService = require('../services/session')
const searchingService = require('../services/searching')
const { inSessionCache, usersCache, searchingCache, connectingCache } = require('../server')

const router = express.Router()

router.post('/end', async (req, res) => {
    
    usersCache.find((value) => {
        if (value.user_session_id === req.session.id) {
            
            const user = value

            // Remove from searching
            if (searchingCache.has(user.uid)) {
                searchingService.remove(user.uid, 'stop')
            }

            // Remove from connecting
            if (connectingCache.has(user.uid)) {
                sessionService.end(value.uid)
            }
            
            // Session disconnect
            inSessionCache.find((value, key) => {
                if ([value.uid1, value.uid2].includes(user.uid)) {

                    const { candidates, bytesIO } = req.body
                    let data
                    if (bytesIO && bytesIO.bytesSent && bytesIO.bytesReceived && candidates && candidates.localCandidateType && candidates.remoteCandidateType ) {
                        data = {
                            bytesSent: bytesIO.bytesSent,
                            bytesReceived: bytesIO.bytesReceived,
                            localCandidateType: candidates.localCandidateType,
                            remoteCandidateType: candidates.remoteCandidateType
                        }
                    } else { data = null }

                    value.uid1 === user.uid ? sessionService.end(value.uid1, data) : sessionService.end(value.uid2, data)
                    return
                }
            })

            return

        }
    })

})

module.exports = router