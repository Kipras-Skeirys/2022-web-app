const express = require('express')
const searching = require('../services/searching')
const { searchingCache } = require('../server')

const router = express.Router()

router.get('/', async (req, res) => {
    if (req.session.searching_auth) {

        if (!searchingCache.has(req.session.uid)) {
            const response = await searching.add(req.session.uid, req.session.matching_pref)
        
            if (response === 'ok') {
                res.status(200).end()
            } else {
                res.status(500).json({error: 'Internal Server Error: failed to start searching'})
            }
        } else {
            res.status(401).json({error: 'API rate limited: "Already in searching for a match"'})
        }

    } else {
        res.status(401).json({error: 'Unauthorized API request'})
    }

})

router.get('/remove', async (req, res) => {

    if (searchingCache.has(req.session.uid)) {
        const response = await searching.remove(req.session.uid, 'stop')
        if (response === 'ok') {
            res.status(200).end()
        } else {
            res.status(500).json({error: 'Internal Server Error'})
        }
    }else {
        res.status
        (200).end()
    }

})

module.exports = router