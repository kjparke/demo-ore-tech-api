const express = require("express");
const eventController = require("../controllers/EventController");
const {
  updateEventDetail,
} = require("../controllers/page-controllers/modal/EventDetailModalController");

const router = express.Router();
router.get("/events", eventController.readEvents);
router.post(
  "/",
  eventController.createEvent
);
router.post(
  "/:id",
  eventController.addNoteToEvent
);
router.patch("/", async (req, res) => {
  const eventDetail = req.body.data;
  try {
    const updatedEvent = await updateEventDetail(eventDetail);
    res.status(201).json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json("Error while updating event, please try again.");
  }
});
router.delete("/:id", eventController.deleteEvent);
router.get("/:id/notes", eventController.readEventNotes);

module.exports = router;
