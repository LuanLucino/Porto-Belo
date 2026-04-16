// Controllers dos endpoints de fornecedor.
// Validação de CNPJ (check digit, formato) é responsabilidade do frontend.
// Aqui garantimos presença do parâmetro e propagamos os erros do Sienge de forma coerente.

const { siengeGateway } = require('../services/siengeService');
exports._isSupplierRegistered = async (req, res, next) => {
  try {
    const cnpj = req.query.cnpj;
    if (!cnpj) {
      return res.status(400).json({ error: 'cnpj é obrigatório.' });
    }

    const supplier = await siengeGateway.getSupplier(cnpj);
    return res.json({ isRegistered: supplier !== null });
  } catch (err) {
    // (boolean endpoint: true of false, exists or not exists.)
    if (err.statusCode === 400) {
      return res.json({ isRegistered: false });
    }
    return next(err);
  }
};

exports._getSupplier = async (req, res, next) => {
  try {
    const cnpj = req.query.cnpj;
    if (!cnpj) {
      return res.status(400).json({ error: 'cnpj é obrigatório.' });
    }

    const supplierData = await siengeGateway.getSupplier(cnpj);
    if (!supplierData) {
      return res.status(404).json({ error: 'Fornecedor não encontrado no Sienge.' });
    }

    return res.json({ supplierData });
  } catch (err) {
    // Propaga 400 do Sienge (CNPJ mal formado) com a mensagem útil.
    return next(err);
  }
};

exports._getContracts = async (_req, res, next) => {
  try {
    const supplierContracts = await siengeGateway.getAllContracts();
    return res.json({ supplierContracts });
  } catch (err) {
    return next(err);
  }
};