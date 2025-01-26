const express = require("express");
const qs = require("qs");
const { readDownAssetPages, exportDownAssetCSV } = require('../controllers/page-controllers/asset-view/AssetViewController');
const { createQueryString } = require("../controllers/AssetController");


const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const { page, pageSize, sort, ...query } = req.query;
    const { assetQueryString, eventQueryString, hasTechnicianFilter } =
      createQueryString(query);

    const result = await readDownAssetPages({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      assetQueryString,
      eventQueryString,
      sortParams: qs.parse(sort) || [],
      hasTechnicianFilter
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/export", async (req, res) => {
  try {
    const { page, pageSize, sort, ...query } = req.query;
    const { assetQueryString, eventQueryString, hasTechnicianFilter } = createQueryString(query);

    const csvData = await exportDownAssetCSV({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      assetQueryString,
      eventQueryString,
      sortParams: qs.parse(sort) || [],
      hasTechnicianFilter
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('exported_assets.csv');
    res.send(csvData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
