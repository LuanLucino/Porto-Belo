// Camada de serviço: ÚNICO lugar que fala com a API externa do Sienge.
// Se amanhã o Sienge mudar, só este arquivo muda.
// Controllers chamam este service; o frontend nunca.

const axios = require('axios');
const { env } = require('../config/env');


// This gateway is responsible for making asynchronous calls to the Sienge API
// This gateway instantiates an async client that can be used with the gateway methods

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

  // This function returns the supplier data
  async getSupplier(cnpj) {
    try {
      const response = await this.client.get("/creditors", {
        params: { cnpj },
      });

      return response.data.results && response.data.results.length > 0 ? response.data.results[0] : null;
    } catch (error) {
      console.error("Error fetching supplier data from Sienge:", error);
      throw new Error("Failed to fetch supplier data from Sienge");
    }
  }

  async getContracts(cnpj) {
    try {
      const response = await this.client.get("/contracts", {
        params: { cnpj },
      });

      return typeof response.data.results === 'object' ? response.data.results : [];
    } catch (error) {
      console.error("Error fetching supplier contracts from Sienge:", error);
      throw new Error("Failed to fetch supplier contracts from Sienge");
    }
  }
}

// Instanciate the gateway with settings from env
const siengeGateway = new AsyncSiengeGateway({
  baseUrl: env.sienge.baseUrl,
  sienge_user: env.sienge.user,
  sienge_password: env.sienge.password,
  timeoutMs: env.sienge.timeoutMs,
});

module.exports = { siengeGateway };
