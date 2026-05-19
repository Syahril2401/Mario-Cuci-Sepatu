const Promo = require('../models/promoModel');

exports.getAllPromos = async (req, res) => {
  try {
    const promos = await Promo.getAll();
    res.json({ data: promos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPromoById = async (req, res) => {
  try {
    const promo = await Promo.getById(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo not found' });
    res.json({ data: promo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPromo = async (req, res) => {
  try {
    const result = await Promo.create(req.body);
    res.status(201).json({ message: 'Promo created', data: { promo_id: result.insertId, ...req.body } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePromo = async (req, res) => {
  try {
    await Promo.update(req.params.id, req.body);
    res.json({ message: 'Promo updated', data: { promo_id: req.params.id, ...req.body } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePromo = async (req, res) => {
  try {
    await Promo.delete(req.params.id);
    res.json({ message: 'Promo deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
