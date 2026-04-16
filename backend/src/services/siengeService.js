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

  async saveInvoice(invoice) {
    try {
      const response = await this.client.post('/bills', invoice);
      return response.data;
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao salvar nota no Sienge.');
      if (mapped === null) throw SiengeUtils.httpError(404, 'Recurso não encontrado no Sienge.');
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

  async saveInvoice(invoice) {
    return {
      id: Math.floor(Math.random() * 100000),
      status: 'RECEIVED',
      receivedAt: new Date().toISOString(),
      invoice,
    };
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
