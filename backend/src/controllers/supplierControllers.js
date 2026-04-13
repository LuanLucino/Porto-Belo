// Controller: recebe a request, valida, delega para o service e responde.
// Regra: controller NUNCA chama axios nem API externa direto — passa pelo service.

const siengeGateway = require('../services/siengeService');

// Refactoring the verificarCnpj function to use the new AsyncSiengeGateway service

exports._getSupplier = async (req, res, next) => {
  try {
    const { cnpj } = req.body;
    if (!cnpj) {
      return res.status(400).json({ error: 'CNPJ é obrigatório.' });
    }
    else if (cnpj.length !== 14) {
      return res.status(400).json({ error: 'CNPJ deve conter 14 dígitos.' });
    }
    else if (typeof cnpj !== 'string') {
      return res.status(400).json({ error: 'CNPJ deve ser uma string.' });
    }
    const supplierData = await siengeGateway.getSupplier(cnpj);
    return res.json({ supplierData });
  } catch (err) {
    return next(err);
  }
};

exports._getContracts = async (req, res, next) => {
  // This function assumes that the supplier cnpjs is already validated and registered
  try {
    const { cnpj } = req.body;
    const supplierContracts = await siengeGateway.getContracts(cnpj);
    return res.json({ supplierContracts });

  } catch (err) {
    return next(err);
  }
};
