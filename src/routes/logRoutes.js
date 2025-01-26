const express = require('express');
const logController = require('../controllers/LogController');

const router = express.Router();

router.get("/", logController.readlogs);
router.get("/:eventId", logController.readGroupedLogs);

module.exports = router;