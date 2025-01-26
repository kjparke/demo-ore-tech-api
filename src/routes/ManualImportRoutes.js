const express = require("express");
const authMiddleware = require("../middleware/authMiddleWare.js");
const {
  createNewEvent,
  createNewAssetAndEvent,
} = require("../controllers/page-controllers/modal/ManualImportController.js");
const router = express.Router();

// Route for creating manual event
router.post(
  "/create-manual-event",
  authMiddleware.verifyToken,
  authMiddleware.verifyPermissions("canWriteAll"),
  async (req, res) => {
    const { data, metaData } = req.body;
    try {
      const newEvent = await createNewEvent(data, metaData);
      res.status(200).json(newEvent);
    } catch (error) {
      res.status(500).json({
        message: "An error was encountered while creating this manual event.",
        error: error.message,
      });
    }
  }
);

// Route for creating asset and event
router.post(
  "/create-asset",
  authMiddleware.verifyToken,
  authMiddleware.verifyPermissions("canWriteAll"),
  async (req, res) => {
    const { data, metaData } = req.body;
    try {
      const result = await createNewAssetAndEvent(data, metaData);

      if (result.error) {
        return res.status(400).json({ message: result.message });
      }
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        message: "An error was encountered while creating this asset.",
        error: error.message,
      });
    }
  }
);

module.exports = router;