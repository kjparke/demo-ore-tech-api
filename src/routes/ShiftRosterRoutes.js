const express = require('express');
const router = express.Router();
const {updateShiftRoster, createShiftRoster, readShiftRoster} = require('../controllers/ShiftRosterController');
const { determineCurrentShift } = require('../controllers/utils/DetermineCurrentShift');

router.post('/update', async (req, res) => {
  const { eventId, names} = req.body; 

  try {
    const {date, shiftType} = determineCurrentShift();
    const updatedRoster = await updateShiftRoster(
      { eventId, date, shift: shiftType },  
      { $set: { names } }
    );

    if (!updatedRoster) {
      const newRoster = await createShiftRoster({
        eventId,
        date, 
        shift: shiftType,
        names,
      });
      return res.status(201).json(newRoster);
    }

    res.status(200).json(updatedRoster);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating the shift roster', error });
  }
});

router.get('/', async (req, res) => {
    const { eventId } = req.query;
  
    try {
      const { date, shiftType } = determineCurrentShift();
      const shiftRoster = await readShiftRoster({ eventId, shift: shiftType, date });
      res.status(201).json(shiftRoster);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching shift roster', error });
    }
  });

module.exports = router;