const {
  createLocationDelta,
  readLocationDeltas,
  updateLocationDeltas,
} = require("../controllers/LocationDeltaController");

const express = require("express");
const router = express.Router();

// POST route for creating a location delta
router.post("/", async (req, res) => {
  try {
    const { location, bay, eventId } = req.body;
    const newLocationDelta = await createLocationDelta(location, bay, eventId);
    await newLocationDelta.save();
    res.status(201).json(newLocationDelta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET route for reading location deltas
router.get("/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const locationDeltas = await readLocationDeltas(eventId);
    res.json(locationDeltas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/location-delta/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const update = req.body;
    const updatedLocationDelta = await updateLocationDeltas(id, update);
    res.json(updatedLocationDelta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
