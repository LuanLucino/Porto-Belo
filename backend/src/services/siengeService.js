// ÚNICO lugar que fala com a API externa do Sienge.
// Responsabilidades:
//  - Fazer chamadas HTTP.
//  - TRADUZIR a resposta real do Sienge para o schema estável usado pelo frontend.
//  - Tratar "não encontrado" (404) como null/lista vazia — não como erro.
// O resto do código (controllers, frontend) só conhece o schema traduzido abaixo.

// Schemas for the frontend (adapted)
//   Supplier  -> { id, cnpj, name, tradeName, stateRegistrationNumber, personType }
//   Contract  -> { id, code, contractName, constructionName, technicalRetention }

const axios = require('axios');
const FormData = require('form-data');
const { env } = require('../config/env');
const { SiengeUtils } = require('../utils/siengeServicesUtils');


// ---------- Gateway real ----------
class AsyncSiengeGateway {
  constructor(settings) {
    this.client = axios.create({
      baseURL: settings.baseUrl,
      timeout: settings.timeoutMs,
      auth: { username: settings.sienge_user, password: settings.sienge_password },
    });
  }

  async getSupplier(cnpj) {
    try {
      const response = await this.client.get('/creditors', { params: { cnpj } });
      const first = response.data?.results?.[0] ?? null;
      return SiengeUtils.adaptSupplier(first);
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao consultar fornecedor no Sienge.');
      if (mapped === null) return null;
      throw mapped;
    }
  }

  async getContractsPage(offset, limit) {
    const response = await this.client.get('/supply-contracts/all', { params: { offset, limit } });
    return response.data;
  }

  async getSupplierContracts(supplierId) {
    const PAGE_SIZE = 200;
    try {

      // gets the count
      const first = await this.getContractsPage(0, 1);
      const total = first?.resultSetMetadata?.count ?? 0;
      if (total === 0) return [];

      // creates the parallel requests
      const pages = Math.ceil(total / PAGE_SIZE);
      const requests = Array.from({ length: pages }, (_, i) =>
        this.getContractsPage(i * PAGE_SIZE, PAGE_SIZE)
      );
      const responses = await Promise.all(requests);

      // concatenates and adapts the results
      const all = responses.flatMap(r =>
        Array.isArray(r?.results) ? r.results : []
      );

      const supplierContracts = all.filter(c => c.supplierId === supplierId);

      return supplierContracts.map(SiengeUtils.adaptContract);
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao consultar contratos no Sienge.');
      if (mapped === null) return [];
      throw mapped;
    }
  }

  async getCompanies() {
    try {
      const response = await this.client.get('/companies')
      const list = Array.isArray(response.data?.results) ? response.data.results : [];
      return list.map(SiengeUtils.adaptCompany);
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao consultar empresas no Sienge.');
      if (mapped === null) throw SiengeUtils.httpError(404, 'Recurso não encontrado no Sienge.');
      throw mapped;
    }
  }

  async getContractItems(documentId, contractNumber, buildingId, buildingUnitId) {
    const params = {
      documentId: documentId,
      contractNumber: contractNumber,
      buildingId: buildingId,
      buildingUnitId: buildingUnitId,
    }
    try {
      const response = await this.client.get("/supply-contracts/items", { params });
      const items = Array.isArray(response.data?.results) ? response.data.results : [];
      return items.map(SiengeUtils.adaptContractItem);
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao consultar itens do contrato no Sienge.');
      if (mapped === null) return [];
      throw mapped;
    }
  }

  async getContractBuildings(documentId, contractNumber) {
    const params = { documentId, contractNumber };
    try {
      const response = await this.client.get("/supply-contracts/buildings", { params });
      const results = Array.isArray(response.data?.results) ? response.data.results : [];
      return results.map(SiengeUtils.adaptContractBuilding);
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao consultar edifícios do contrato no Sienge.');
      if (mapped === null) return [];
      throw mapped;
    }
  }
  async createMeasurement(documentId, contractNumber, buildingId, body) {
    const params = {
      documentId: documentId,
      contractNumber: contractNumber,
      buildingId: buildingId,
    }
    const json = {
      measurementDate: body.measurementDate,
      dueDate: body.dueDate,
      notes: body.notes,
      makeUnauthorized: true,
      items: (body.items ?? []).map(item => ({
        buildingUnitId: item.buildingUnitId,
        itemId: item.itemId,
        measuredQuantity: item.measuredQuantity,
      })),
    }
    try {
      const response = await this.client.post("/supply-contracts/measurements", json, { params });
      return response.data ?? null;
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao criar medição no Sienge.');
      if (mapped === null) throw SiengeUtils.httpError(404, 'Contrato não encontrado no Sienge.');
      throw mapped;
    }
  }

  async sendMeasurementAttachment({ documentId, contractNumber, buildingId, measurementNumber, description, file }) {
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      const response = await this.client.post('/supply-contracts/measurements/attachments', form, {
        params: { documentId, contractNumber, buildingId, measurementNumber, description },
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      return response.data ?? null;
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao enviar anexo da medição no Sienge.');
      if (mapped === null) throw SiengeUtils.httpError(404, 'Medição não encontrada no Sienge.');
      throw mapped;
    }
  }
}

// ---------- Gateway mock ----------
class MockSiengeGateway {
  async getSupplier(cnpj) {
    return {
      id: 1,
      cnpj,
      name: 'FORNECEDOR EXEMPLO LTDA',
      tradeName: 'EXEMPLO',
      stateRegistrationNumber: '123456789',
      personType: 'LEGAL',
    };
  }

  async getSupplierContracts(supplierId) {
    const allContracts = await this.getAllContracts();
    return allContracts.filter(c => c.supplierId === supplierId);
  }

  async getCompanies() {
    return [
      { id: 1, name: 'CONSTRUTORA PORTO BELO LTDA', cnpj: '12.345.678/0001-90', tradeName: 'PORTO BELO' },
      { id: 2, name: 'CONSTRUTORA MARINA LTDA', cnpj: '98.765.432/0001-10', tradeName: 'MARINA' },
      { id: 3, name: 'CONSTRUTORA SOLARES LTDA', cnpj: '11.223.344/0001-55', tradeName: 'SOLARES' },
    ];
  }

  async getContractItems(documentId, contractNumber, buildingId, buildingUnitId) {
    return [
      { id: 1, description: 'SERVIÇOS DE CONSULTORIA — fundação', quantity: 1, unit: 'vb', laborPrice: 200, materialPrice: 0, unitPrice: 200, totalPrice: 200, buildingUnitId: 1, sheetItemId: 5, wbsCode: '00.000.000.001' },
      { id: 2, description: 'SERVIÇOS DE CONSULTORIA — alvenaria', quantity: 1, unit: 'vb', laborPrice: 300, materialPrice: 0, unitPrice: 300, totalPrice: 300, buildingUnitId: 1, sheetItemId: 6, wbsCode: '00.000.000.002' },
    ];
  }

  async getContractBuildings(documentId, contractNumber) {
    return [
      { buildingId: 99991, name: 'Obra exemplo', buildingUnitId: 1, buildingUnits: [{ id: 1 }] },
    ];
  }

  async createMeasurement(documentId, contractNumber, buildingId, body) {
    return { id: Math.floor(Math.random() * 10000), status: 'MOCK_CREATED', ...body };
  }

  async sendMeasurementAttachment({ file, description }) {
    return { status: 'MOCK_ATTACHED', filename: file?.originalname ?? null, description };
  }
}

// ---------- Boot ----------
const siengeGateway = env.sienge.mock
  ? new MockSiengeGateway()
  : new AsyncSiengeGateway({
    baseUrl: env.sienge.baseUrl,
    sienge_user: env.sienge.user,
    sienge_password: env.sienge.password,
    timeoutMs: env.sienge.timeoutMs,
  });

module.exports = { siengeGateway, AsyncSiengeGateway, MockSiengeGateway };
