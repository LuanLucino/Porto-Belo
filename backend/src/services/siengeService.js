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
const { SiengeUtils } = require('../utils/utils');


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

  async getContracts() {
    try {
      const response = await this.client.get('/supply-contracts/all');
      const list = Array.isArray(response.data?.results) ? response.data.results : [];
      return list.map(SiengeUtils.adaptContract);
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

  async getContracts() {
    return [
      { id: 102, code: 'CTR-102', contractName: 'FORNECIMENTO DE CONCRETO', constructionName: 'EDIFICIO PORTO BELO', technicalRetention: 'R$ 500,00' },
      { id: 205, code: 'CTR-205', contractName: 'SERVIÇOS DE PINTURA', constructionName: 'RESIDENCIAL MARINA', technicalRetention: 'R$ 0,00' },
      { id: 309, code: 'CTR-309', contractName: 'INSTALAÇÃO ELÉTRICA', constructionName: 'CONDOMINIO SOLARES', technicalRetention: 'R$ 1.200,00' },
    ];
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
