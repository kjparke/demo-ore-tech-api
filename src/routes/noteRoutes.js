const express = require('express');
const noteController = require('../controllers/NoteController');

const router = express.Router();
router.post('/', noteController.createNoteTest);
router.get('/:id', noteController.readEventNotes);

module.exports = router;