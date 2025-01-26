const express = require('express');
const eventController = require('../controllers/EventController');
const authMiddleware = require('../middleware/authMiddleWare');
const { updateEventDetail } = require('../controllers/page-controllers/modal/EventDetailModalController');

const router = express.Router();
router.get('/events', authMiddleware.verifyToken, eventController.readEvents);
router.post('/', authMiddleware.verifyToken, authMiddleware.verifyPermissions("canWriteAll"), eventController.createEvent);
router.post("/:id",authMiddleware.verifyToken, authMiddleware.verifyPermissions("canWriteNotes"), eventController.addNoteToEvent);
router.patch("/",
    authMiddleware.verifyToken, 
    authMiddleware.verifyPermissions("canWriteAll"), 
    async (req, res) => {
	    const eventDetail = req.body.data;
        try {
            const updatedEvent = await updateEventDetail(eventDetail);
            res.status(201).json(updatedEvent);
        } catch (error) {
            console.error(error);
            res.status(500).json("Error while updating event, please try again.")
        }
});
router.delete("/:id",authMiddleware.verifyToken, eventController.deleteEvent);
router.get("/:id/notes", eventController.readEventNotes);

module.exports = router;