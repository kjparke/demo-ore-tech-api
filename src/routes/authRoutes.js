const express           = require('express');
const auth              = require("../controllers/Auth");
const authMiddleware    = require('../middleware/authMiddleWare');

const router = express.Router();

router.post('/register', auth.register);
router.post('/signin', auth.signin);
router.patch('/change-password', auth.changePassword);
router.patch('/changeEmail', authMiddleware.verifyToken,  auth.changeEmail);
router.patch('/changeAccessLevel', authMiddleware.verifyToken, auth.changeAccessLevel);
router.patch('/updateName', authMiddleware.verifyToken, auth.updateName);
router.patch('/admin-pwd-reset', auth.adminResetPassword);

module.exports = router;