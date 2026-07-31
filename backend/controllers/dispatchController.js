const finalizationService = require('../services/finalizationService');

exports.finalizeOrder = async (req, res) => {
  res.status(200).json({ message: 'Order finalization placeholder' });
};

exports.assignDriver = async (req, res) => {
  res.status(200).json({ message: 'Driver assignment placeholder' });
};
