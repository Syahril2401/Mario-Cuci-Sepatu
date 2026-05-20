const express = require('express');
const router = express.Router();
const landingController = require('../controllers/landingController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/', landingController.getLandingConfig);
router.put('/', verifyToken, verifyAdmin, landingController.updateLandingConfig);

module.exports = router;
