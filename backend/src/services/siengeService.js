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

// HTTPError: carrega statusCode pro errorHandler respeitar.
class HTTPError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Traduz erros do axios (Sienge) em HTTPError com semântica clara.
//   - 400  -> HTTPError(400, <mensagem do Sienge>)  — cliente mandou lixo
//   - 401/403 -> HTTPError(502, ...)                — config/credencial nossa
//   - 404  -> retorna null (deixa o chamador decidir o que fazer)
//   - 5xx/timeout -> HTTPError(502, ...)            — Sienge fora
function mapSiengeError(err, fallbackMessage) {
  const status = err?.response?.status;
  const siengeMsg = err?.response?.data?.developerMessage
    || err?.response?.data?.clientMessage;

  if (status === 404) return null;
  if (status === 400) {
    return new HTTPError(400, siengeMsg || 'Requisição inválida.');
  }
  console.error('[Sienge]', err.message, siengeMsg || '');
  return new HTTPError(502, fallbackMessage);
}

// ---------- Adapters: Sienge raw -> schema do frontend ----------

function adaptSupplier(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? null,
    cnpj: raw.cnpj ?? null,
    name: raw.name ?? raw.corporateName ?? '',
    tradeName: raw.tradeName ?? raw.fantasyName ?? '',
    stateRegistrationNumber: raw.stateRegistrationNumber ?? '',
    personType: raw.personType ?? '',
  };
}

function adaptContract(raw) {
  return {
    id: raw.id ?? raw.contractNumber ?? null,
  };
}

function adaptCompany(raw) {
  const dataFromSienge = companies.results
  const formattedData = dataFromSienge.map(company => ({
    id: company.id,
    name: company.name,
    cnpj: company.cnpj,
    tradeName: company.tradeName,
  }));
  return formattedData;
}
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
      return adaptSupplier(first);
    } catch (err) {
      const mapped = mapSiengeError(err, 'Falha ao consultar fornecedor no Sienge.');
      if (mapped === null) return null;
      throw mapped;
    }
  }

  async getContractsByCompanyId(companyId) {
    try {
      const response = await this.client.get('/supply-contracts/all', { params: { companyId } });
      const list = Array.isArray(response.data?.results) ? response.data.results : [];
      return list.map(adaptContract);
    } catch (err) {
      const mapped = mapSiengeError(err, 'Falha ao consultar contratos no Sienge.');
      if (mapped === null) return [];
      throw mapped;
    }
  }

  async getCompanies() {
    try {
      const response = await this.client.get('/companies')
      const list = Array.isArray(response.data?.results) ? response.data.results : [];
      return list.map(adaptCompany);
    } catch (err) {
      const mapped = mapSiengeError(err, 'Falha ao consultar empresas no Sienge.');
      if (mapped === null) return [];
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

  async getContractsByCompanyId(companyId) {
    return [
      { id: 102, code: 'CTR-102', contractName: 'FORNECIMENTO DE CONCRETO', constructionName: 'EDIFICIO PORTO BELO', technicalRetention: 'R$ 500,00' },
      { id: 205, code: 'CTR-205', contractName: 'SERVIÇOS DE PINTURA', constructionName: 'RESIDENCIAL MARINA', technicalRetention: 'R$ 0,00' },
      { id: 309, code: 'CTR-309', contractName: 'INSTALAÇÃO ELÉTRICA', constructionName: 'CONDOMINIO SOLARES', technicalRetention: 'R$ 1.200,00' },
    ];
  }

  async getCompanies() {
    return [
      { id: 1, name: 'CONSTRUTORA PORTO BELO LTDA', cnpj: '12.345.678/0001-90', tradeName: 'PORTO BELO' },
      { id: 2, name: 'CONSTRUTORA MARINA LTDA', cnpj: '98.765.432/0001-10', tradeName: 'MARINA' },
      { id: 3, name: 'CONSTRUTORA SOLARES LTDA', cnpj: '11.223.344/0001-55', tradeName: 'SOLARES' },
    ];
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

module.exports = { siengeGateway, AsyncSiengeGateway, MockSiengeGateway, HTTPError };
