const express = require('express');
const qs = require('qs');
const assetController = require('../controllers/AssetController');
const authMiddleware = require('../middleware/authMiddleWare');

const router = express.Router();
router.post('/', authMiddleware.verifyToken, authMiddleware.verifyPermissions("canWriteAll"), assetController.createAsset);
router.get('/operationalAssets', assetController.readOperationalAssets);
router.get('/down-assets', assetController.readDownAssets);
router.get('/:id', authMiddleware.verifyToken, assetController.readAsset);
router.post('/asset', authMiddleware.verifyToken, assetController.createAsset);
router.post('/release', authMiddleware.verifyToken, authMiddleware.verifyPermissions("canWriteAll"), assetController.releaseAsset);
router.patch('/manualImport', authMiddleware.verifyToken, authMiddleware.verifyPermissions("canWriteAll"), assetController.manuallyCreateDownAsset);
router.patch('/:id', authMiddleware.verifyToken, authMiddleware.verifyPermissions("canWriteAll"), assetController.updateAsset);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.verifyPermissions("canDeleteAll"), assetController.deleteAsset);

module.exports = router;