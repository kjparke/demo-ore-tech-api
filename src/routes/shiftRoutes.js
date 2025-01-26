const express = require('express');
const shiftController = require('../controllers/ShiftController');
const eventDeltaController = require('../controllers/EventDeltaController')

const router = express.Router();

router.post('/addShift', shiftController.addShift);
router.get('/:id', eventDeltaController.readLastEventDeltaPerHour);
router.get('/getAllShifts', shiftController.getAllShifts);
router.patch('/:id', eventDeltaController.updateEventDelta);

module.exports = router;