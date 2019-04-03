const express = require('express')
const router = express.Router()
const handler = require('./handler')

router
    .get('/', handler.showIndex)
    .get('/musicList', handler.getMusicList)
    .get('/remove', handler.doRemove)
    .get('/add', handler.showAdd)
    .post('/add', handler.doAdd)
    .get('/edit', handler.showEdit)
    .post('/edit', handler.doEdit)
    .post('/uploads',handler.uploads)

module.exports = router