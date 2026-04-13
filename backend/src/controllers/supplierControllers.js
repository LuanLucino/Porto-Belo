// Controller: recebe a request, valida, delega para o service e responde.
// Regra: controller NUNCA chama axios nem API externa direto — passa pelo service.

const { siengeGateway } = require('../services/siengeService');

exports._getSupplier = async (req, res, next) => {
  try {
    const { cnpj } = req.query;

    if (!cnpj) {
      return res.status(400).json({ error: 'CNPJ é obrigatório.' });
    }
    if (typeof cnpj !== 'string') {
      return res.status(400).json({ error: 'CNPJ deve ser uma string.' });
    }
    if (cnpj.length !== 14) {
      return res.status(400).json({ error: 'CNPJ deve conter 14 dígitos.' });
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
