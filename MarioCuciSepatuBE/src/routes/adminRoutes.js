const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/dashboard-stats', verifyToken, verifyAdmin, adminController.getDashboardStats);

module.exports = router;
