const express = require("express");
const authMiddleware = require("../middleware/authMiddleWare");
const qs = require("qs");
const { createQueryString } = require("../controllers/AssetController");
const { readShopAssets } = require("../controllers/page-controllers/shop-view/ShopViewController");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { sort, ...query } = req.query; 
    const { assetQueryString, eventQueryString, hasTechnicianFilter } = createQueryString(query);

    const result = await readShopAssets({
      assetQueryString,
      eventQueryString,
      sortParams: qs.parse(sort) || [],
      hasTechnicianFilter,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;