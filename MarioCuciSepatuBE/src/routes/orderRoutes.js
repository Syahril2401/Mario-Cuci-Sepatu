const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, orderController.getAllOrders);
router.get('/active', verifyToken, orderController.getActiveOrders);
router.get('/stats', orderController.getDailyStats);
router.get('/:id', verifyToken, orderController.getOrderById);
router.post('/', verifyToken, orderController.createOrder);
router.put('/:id', verifyToken, verifyAdmin, orderController.updateOrder);

module.exports = router;
