const express = require("express");
const ahsCalibrationsController = require("../controllers/page-controllers/ahs-calibration-view/AHSCalibrationsController");
const { updateAHSAsset } = require("../controllers/AHSAssetController");

const router = express.Router();
router.post("/", async (req, res) => {
  const { _id, ...ahsCalibrationRecord } = req.body.data;
  const metaData = req.body.metaData;
  try {
    const savedAHSREcord =
      await ahsCalibrationsController.createAHSCalibrationRecord(
        ahsCalibrationRecord
      );
    await updateAHSAsset(
      { unitId: ahsCalibrationRecord.unitId },
      {
        minestarVersion: ahsCalibrationRecord.minestarVersion,
        lastUpdatedBy: metaData.id,
      }
    );
    res.status(200).json(savedAHSREcord);
  } catch (error) {
    console.error(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const ahsCalibrationRecords =
      await ahsCalibrationsController.readAHSCalibrations();
    if (!ahsCalibrationRecords.length) {
      return res.status(404).json({
        msg: "No AHS Calibration Records found.",
      });
    }
    res.status(200).json(ahsCalibrationRecords);
  } catch (error) {
    console.error(error);
  }
});

router.get("/calibration-fleet-status", async (req, res) => {
  try {
    const ahsTrucks =
      await ahsCalibrationsController.ahsTrucksWithRecordsPipeline();
    res.status(200).json(ahsTrucks);
  } catch (error) {
    console.error(error);
  }
});

router.get("/archived", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;
  try {
    const archivedAHSCalibrations =
      await ahsCalibrationsController.readArchivedAHSCalibrations(
        page,
        pageSize,
        skip
      );
    res.status(200).json(archivedAHSCalibrations);
  } catch (error) {
    console.error(error);
  }
});

router.patch("/", async (req, res) => {
  const { data, metaData } = req.body;
  const assetFilter = { unitId: data.unitId };
  const assetUpdate = {
    minestarVersion: data.minestarVersion,
    lastUpdatedBy: metaData.id,
  };
  try {
    const updatedAHSCalibrationRecord =
      await ahsCalibrationsController.updateAHSCalibrations(data);
    await updateAHSAsset(assetFilter, assetUpdate);
    res.status(200).json(updatedAHSCalibrationRecord);
  } catch (error) {
    console.error(error);
  }
});

router.patch("/ahs-asset", async (req, res) => {
  const data = req.body.data;
  const metaData = req.body.metaData;
  try {
    const filter = { unitId: data.unitId };
    const update = { ...data, lastUpdatedBy: metaData.id };
    const updatedAHSAsset = await updateAHSAsset(filter, update);
    res.status(200).json(updatedAHSAsset);
  } catch (error) {
    console.error(error);
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const deletedAHSCalibrationrecord =
      await ahsCalibrationsController.deleteAHSCalibrationRecord(id);
    res.status(200).json(deletedAHSCalibrationrecord);
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
