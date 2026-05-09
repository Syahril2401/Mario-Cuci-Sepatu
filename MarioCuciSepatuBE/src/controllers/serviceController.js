const Service = require('../models/serviceModel');

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.getAll();
    res.json({ data: services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.getById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ data: service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const result = await Service.create(req.body);
    res.status(201).json({ message: 'Service created', data: { service_id: result.insertId, ...req.body } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    await Service.update(req.params.id, req.body);
    res.json({ message: 'Service updated', data: { service_id: req.params.id, ...req.body } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await Service.delete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
