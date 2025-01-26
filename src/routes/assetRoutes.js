const express = require('express');
const assetController = require('../controllers/AssetController');

const router = express.Router();
router.post('/', assetController.createAsset);
router.get('/operationalAssets', assetController.readOperationalAssets);
router.get('/down-assets', assetController.readDownAssets);
router.get('/:id', assetController.readAsset);
router.post('/asset', assetController.createAsset);
router.post('/release', assetController.releaseAsset);
router.patch('/manualImport', assetController.manuallyCreateDownAsset);
router.patch('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

module.exports = router;