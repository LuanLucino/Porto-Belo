const { siengeGateway } = require('../services/siengeService');

// Endpoint booleano usado pelo home para decidir se libera o fluxo;
// trata erro 400 como "não cadastrado" porque o Sienge retorna assim.
exports._isSupplierRegistered = async (req, res, next) => {
  try {
    const cnpj = req.query.cnpj;
    if (!cnpj) {
      return res.status(400).json({ error: 'cnpj é obrigatório.' });
    }

    const supplier = await siengeGateway.getSupplier(cnpj);
    return res.json({ isRegistered: supplier !== null });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.json({ isRegistered: false });
    }
    return next(err);
  }
};

// Devolve os dados do fornecedor pro frontend salvar no localStorage
// e usar como contexto nas próximas telas (header, favorecido etc.).
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
    return next(err);
  }
};

// Lista os contratos vinculados ao fornecedor para a tela de seleção;
// supplierId vem do supplier salvo no home.
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

// Pré-carrega as contas bancárias do fornecedor logo no home, pra que
// a tela de pagamento tenha o que sugerir sem nova chamada à rede.
exports._getSupplierBankInfo = async (req, res, next) => {
  try {
    const supplierId = req.query.supplierId;
    if (!supplierId) {
      return res.status(400).json({ error: 'supplierId é obrigatório.' });
    }
    const bankInformations = await siengeGateway.getSupplierBankInformations(Number(supplierId));
    return res.json({ bankInformations });
  } catch (err) {
    return next(err);
  }
};

// Resolve o buildingUnitId do contrato; chamado pelo choose-item antes
// de pedir os itens, porque o /items só funciona com esse id.
exports._getContractBuildings = async (req, res, next) => {
  try {
    const { documentId, contractNumber } = req.query;
    if (!documentId) {
      return res.status(400).json({ error: 'documentId é obrigatório.' });
    }
    if (!contractNumber) {
      return res.status(400).json({ error: 'contractNumber é obrigatório.' });
    }
    const contractBuildings = await siengeGateway.getContractBuildings(documentId, contractNumber);
    return res.json({ contractBuildings });
  } catch (err) {
    return next(err);
  }
};

// Retorna os itens do contrato para o usuário escolher qual será
// medido na tela choose-item.
exports._getContractItems = async (req, res, next) => {
  try {
    const { documentId, contractNumber, buildingId, buildingUnitId } = req.query;
    if (!documentId) {
      return res.status(400).json({ error: 'documentId é obrigatório.' });
    }
    if (!contractNumber) {
      return res.status(400).json({ error: 'contractNumber é obrigatório.' });
    }
    if (!buildingId) {
      return res.status(400).json({ error: 'buildingId é obrigatório.' });
    }
    if (!buildingUnitId) {
      return res.status(400).json({ error: 'buildingUnitId é obrigatório.' });
    }
    const contractItems = await siengeGateway.getContractItems(documentId, contractNumber, buildingId, buildingUnitId);
    return res.json({ contractItems });
  } catch (err) {
    return next(err);
  }
};
