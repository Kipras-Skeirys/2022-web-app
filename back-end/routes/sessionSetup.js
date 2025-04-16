const express = require('express')
const { usersCache } = require('../server')
const { v4: uuidv4 } = require('uuid')
const requestIp = require('request-ip')

const router = express.Router()


function validateData(req, res, next) {
    console.log(req.body);
    const { user_selection1, user_selection2, partner_selection1, partner_selection2 } = req.body
    const validselection1 = ['option1', 'option2', 'option3']
    const validselection2 = ['option1', 'option2', 'option3']
    if (
        validselection1.includes(user_selection1) &&
        validselection2.includes(user_selection2) &&
        partner_selection1.every((i) => validselection1.includes(i)) &&
        partner_selection2.every((i) => validselection2.includes(i))
    ) {
        req.session.matching_pref = req.body
        next()
    }else {
        req.session.searching_auth = false
        res.status(400).json({error: '400: Invalid data submited'})
    }
}

function validateCamera() {
    // [400] Bad Request - Camera covered or not connected
    // res.status(400).json({error: '400: Camera covered or not connected'})

    // [notice] Please hide your face for your own safety.
    //
    // [interupted] No person in view, please get in frame to continue.
    // [critical] Blank camera feed. Please turn on, uncover or improve lighting.
}

async function validateUser(req, res, next) {
    if (!usersCache.find((value) => value.user_session_id === req.session.id && value.user_socket_id === req.session.user_socket_id)) {
        // Create new user
        const uid = uuidv4()
        if (req.session.user_socket_id) {
            usersCache.set(uid, {
                uid,
                uip: requestIp.selection2tClientIp(req),
                user_session_id: req.session.id,
                user_state: 'online',
                user_socket_id: req.session.user_socket_id,
                matching_pref: req.session.matching_pref,
            })
            req.session.uid = uid
            next()
        } else {
            console.log(`[ERROR] [sessionSetup.route] [validateUser] [no socket.id in req] user_socket_id: ${req.session.user_socket_id}`);
            req.session.searching_auth = false
            res.status(400).json({error: '400: Form submitted before connection was established'})
        }
    } else {
        // User already exists
        next()
    }
}

router.post('/', validateData, validateUser, async (req, res) => {
    req.session.searching_auth = true
    res.status(200).end()
})

module.exports = router