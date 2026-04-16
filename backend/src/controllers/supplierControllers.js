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
    // Fix this later, the sienge does not return 404 when supplier is not found,
    // It returns 200 but with an empty array, so we need to handle this case separately
    return next(err);
  }
};

exports._getContracts = async (req, res, next) => {
  try {
    const supplierId = req.query.supplierId;
    if (!supplierId) {
      return res.status(400).json({ error: 'supplierId é obrigatório.' });
    }
    const supplierContracts = await siengeGateway.getSupplierContracts(Number(supplierId));
    return res.json({ supplierContracts });
  } catch (err) {
    return next(err);
  }
};
