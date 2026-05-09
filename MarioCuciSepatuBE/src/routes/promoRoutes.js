const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/', promoController.getAllPromos);
router.get('/:id', promoController.getPromoById);
router.post('/', verifyToken, verifyAdmin, promoController.createPromo);
router.put('/:id', verifyToken, verifyAdmin, promoController.updatePromo);
router.delete('/:id', verifyToken, verifyAdmin, promoController.deletePromo);

module.exports = router;
