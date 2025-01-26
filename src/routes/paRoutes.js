const express = require("express");
const pa = require("../controllers/PhysicalAvailability");

const router = express.Router();

router.get("/", async (_, res) => {
  try {
		const paPercentages = await pa.getPhysicalAvailability();
		res.status(200).json(paPercentages);
  } catch (error) {
    console.log(error);
  }
});
router.get("/categoryCount", pa.getAssetCountByCategory);
router.get("/lastUpdated", pa.getLastUpdated);

module.exports = router;
