// Controllers dos endpoints de fornecedor.
// Validação de CNPJ (check digit, formato) é responsabilidade do frontend.
// Aqui garantimos presença do parâmetro e propagamos os erros do Sienge de forma coerente.

const { siengeGateway } = require('../services/siengeService');
const { ControllerUtils } = require('../utils/controller');

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

exports._getContractsByCompanyId = async (req, res, next) => {
  try {
    const companyId = req.query.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'companyId é obrigatório.' });
    }

    const supplierContracts = await siengeGateway.getContractsByCompanyId(companyId);
    return res.json({ supplierContracts });
  } catch (err) {
    return next(err);
  }
};


exports._getCompanies = async (_req, res, next) => {
  try {
    const companies = await siengeGateway.getCompanies();
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
};


exports.filterSupplierContractsById = async (req, res, next) => {
  try {
    const { companyId, supplierId } = req.query;
    if (!companyId || !supplierId) {
      return res.status(400).json({ error: 'companyId e supplierId são obrigatórios.' });
    }
    const contracts = await siengeGateway.getContractsByCompanyId(companyId);
    const filteredContracts = ControllerUtils.filterContractsBySupplierId(contracts, supplierId);
    return res.json({ contracts: filteredContracts });
  } catch (err) {
    return next(err);
  }
};
