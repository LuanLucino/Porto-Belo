const { siengeGateway } = require('../services/siengeService');
const { validateCNPJ } = require('../utils/sienge');

exports._isSupplierRegistered = async (req, res, next) => {
  try {
    const { value: cnpj, error } = validateCNPJ(req.query.cnpj);
    if (error) {
      return res.status(400).json({ error });
    }

    const supplierData = await siengeGateway.getSupplier(cnpj);
    return res.json({ isRegistered: supplierData !== null });
  } catch (err) {
    return next(err);
  }
};

exports._getSupplier = async (req, res, next) => {
  try {
    const { value: cnpj, error } = validateCNPJ(req.query.cnpj);
    if (error) {
      return res.status(400).json({ error });
    }

    const supplierData = await siengeGateway.getSupplier(cnpj);
    return res.json({ supplierData });
  } catch (err) {
    return next(err);
  }
};

exports._getContracts = async (_req, res, next) => {
  try {
    const supplierContracts = await siengeGateway.getContracts();
    return res.json({ supplierContracts });
  } catch (err) {
    return next(err);
  }
};
