// Camada de serviço: ÚNICO lugar que fala com a API externa do Sienge.
// Se amanhã o Sienge mudar, só este arquivo muda.
// Controllers chamam este service; o frontend nunca.

const axios = require('axios');
const { env } = require('../config/env');

// Gateway real — fala com a API HTTP do Sienge.
class AsyncSiengeGateway {
  constructor(settings) {
    this.client = axios.create({
      baseURL: settings.baseUrl,
      timeout: settings.timeoutMs,
      auth: {
        username: settings.sienge_user,
        password: settings.sienge_password,
      },
    });
  }

  async getSupplier(cnpj) {
    try {
      const response = await this.client.get('/creditors', { params: { cnpj } });
      return response.data.results && response.data.results.length > 0
        ? response.data.results[0]
        : null;
    } catch (error) {
      console.error('Error fetching supplier data from Sienge:', error.message);
      throw new Error('Failed to fetch supplier data from Sienge');
    }
  }

  async getContracts() {
    try {
      const response = await this.client.get('/supply-contracts');
      return Array.isArray(response.data.results) ? response.data.results : [];
    } catch (error) {
      console.error('Error fetching supplier contracts from Sienge:', error.message);
      throw new Error('Failed to fetch supplier contracts from Sienge');
    }
  }
}

// Gateway mock — mesma interface, dados fake.
// Útil em dev sem credenciais, em testes, e quando o Sienge está fora.
class MockSiengeGateway {
  async getSupplier(cnpj) {
    return {
      id: 1,
      cnpj,
      tradingName: 'EXEMPLO',
      name: 'FORNECEDOR EXEMPLO LTDA',
      stateRegistrationNumber: '123456789',
      personType: 'LEGAL',
    };
  }

  async getContracts() {
    return [
      {
        id: 102,
        code: 'CTR-102',
        contractName: 'FORNECIMENTO DE CONCRETO',
        constructionName: 'EDIFICIO PORTO BELO',
        technicalRetention: 'R$ 500,00',
      },
      {
        id: 205,
        code: 'CTR-205',
        contractName: 'SERVIÇOS DE PINTURA',
        constructionName: 'RESIDENCIAL MARINA',
        technicalRetention: 'R$ 0,00',
      },
      {
        id: 309,
        code: 'CTR-309',
        contractName: 'INSTALAÇÃO ELÉTRICA',
        constructionName: 'CONDOMINIO SOLARES',
        technicalRetention: 'R$ 1.200,00',
      },
    ];
  }
}

// Escolhe a implementação no boot. O resto do código não sabe qual está rodando.
const siengeGateway = env.sienge.mock
  ? new MockSiengeGateway()
  : new AsyncSiengeGateway({
      baseUrl: env.sienge.baseUrl,
      sienge_user: env.sienge.user,
      sienge_password: env.sienge.password,
      timeoutMs: env.sienge.timeoutMs,
    });

module.exports = { siengeGateway, AsyncSiengeGateway, MockSiengeGateway };
