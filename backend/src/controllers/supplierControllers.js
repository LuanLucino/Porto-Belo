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
    const { cnpj, limit, offset } = req.query;
    if (!cnpj) {
      return res.status(400).json({ error: 'cnpj é obrigatório.' });
    }

    const supplierData = await siengeGateway.getSupplier(cnpj, limit, offset);
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
    const supplierContracts = await siengeGateway.getContracts();
    return res.json({ supplierContracts });
  } catch (err) {
    return next(err);
  }
};


// This function returns all the contracts and then filter out by the supplier id
// Because the sienge api does not have an endpoint for this kkkkkkkkkkkkkkkkkkkkk 
exports._getAllSupplierContracts = async (req, res, next) => {
  try {
    const { limit, offset, supplierId } = req.query;
    const contractsData = [];

    for (let currentOffset = 0; ; currentOffset += 200) {
      const contracts = await siengeGateway.getContracts(limit, currentOffset);
      if (contracts.length === 0) break;
      contractsData.push(...contracts);
    }
    return res.json({ contractsData });
  } catch (err) {
    return next(err);
  }
}
