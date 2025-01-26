const express = require('express');
const { getAssetsWithEvents } = require('../controllers/page-controllers/history-view/AssetHistoryController');


const router = express.Router();
router.get("/", getAssetsWithEvents);

module.exports = router;