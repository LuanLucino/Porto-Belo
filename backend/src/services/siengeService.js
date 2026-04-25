// Único ponto que fala com a API do Sienge; isola HTTP e tradução de
// schema pro resto do código não saber como o Sienge se comporta.

const axios = require('axios');
const FormData = require('form-data');
const { env } = require('../config/env');
const { SiengeUtils } = require('../utils/siengeServicesUtils');


// Gateway que bate na API real do Sienge; usado quando SIENGE_MOCK=false.
class AsyncSiengeGateway {
  constructor(settings) {
    this.client = axios.create({
      baseURL: settings.baseUrl,
      timeout: settings.timeoutMs,
      auth: { username: settings.sienge_user, password: settings.sienge_password },
    });
  }

  // Busca um fornecedor pelo CNPJ; usado no home pra validar se o
  // fornecedor está cadastrado antes de liberar o restante do fluxo.
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

  // Lista as contas bancárias cadastradas para o fornecedor; usado
  // no home pra pré-carregar e oferecer como sugestão na tela de pagamento.
  async getSupplierBankInformations(supplierId) {
    try {
      const response = await this.client.get(`/creditors/${supplierId}/bank-informations`);
      const results = Array.isArray(response.data?.results) ? response.data.results : [];
      return results.map(SiengeUtils.adaptBankInformation);
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao consultar dados bancários do fornecedor.');
      if (mapped === null) return [];
      throw mapped;
    }
  }

  // Busca uma página única de contratos; helper privado usado pelo
  // getSupplierContracts pra paralelizar a paginação.
  async getContractsPage(offset, limit) {
    const response = await this.client.get('/supply-contracts/all', { params: { offset, limit } });
    return response.data;
  }

  // Devolve todos os contratos do fornecedor; o Sienge não tem filtro
  // por supplier, então pagina tudo em paralelo e filtra em memória.
  async getSupplierContracts(supplierId) {
    const PAGE_SIZE = 200;
    try {
      const first = await this.getContractsPage(0, 1);
      const total = first?.resultSetMetadata?.count ?? 0;
      if (total === 0) return [];

      const pages = Math.ceil(total / PAGE_SIZE);
      const requests = Array.from({ length: pages }, (_, i) =>
        this.getContractsPage(i * PAGE_SIZE, PAGE_SIZE)
      );
      const responses = await Promise.all(requests);

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

  // Lista as empresas (companies) do Sienge; suporte para futura
  // seleção/filtro por empresa no portal.
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

  // Lista os itens medíveis de um contrato; fornece a tabela que o
  // usuário escolhe na tela choose-item antes de criar a medição.
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

  // Resolve o buildingUnitId que o /items exige; o /supply-contracts/all
  // não traz esse campo, então precisamos dessa chamada extra.
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

  // Cria a medição no Sienge; o body é montado pelo controller a
  // partir dos dados que o usuário coletou ao longo do fluxo.
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

  // Anexa um arquivo (NF ou boleto) a uma medição já criada; o Sienge
  // exige multipart e aceita um anexo por chamada.
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

  async getSupplierPaymentInfo(supplierId) {
    try {
      const response = await this.client.get(`/creditors/${supplierId}/bank-informations`);
      return SiengeUtils.adaptPaymentInfo(response.data);
    } catch (err) {
      const mapped = SiengeUtils.mapSiengeError(err, 'Falha ao consultar informações de pagamento do fornecedor no Sienge.');
      if (mapped === null) return null;
      throw mapped;
    }
  }
}

// Gateway com respostas estáticas; usado em dev para trabalhar sem
// depender do Sienge real (ative com SIENGE_MOCK=true no .env).
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

  async getSupplierBankInformations(supplierId) {
    return [
      {
        bankCode: '104',
        bankName: 'CAIXA ECONOMICA FEDERAL',
        agency: '0001',
        accountNumber: '12345-6',
        accountType: 'CC',
        holderName: 'FORNECEDOR EXEMPLO LTDA',
        holderDocument: '12.345.678/0001-99',
        isDefault: true,
      },
    ];
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

// Decide qual gateway exportar baseado no flag SIENGE_MOCK; o resto
// do app só importa `siengeGateway` sem saber qual versão recebeu.
const siengeGateway = env.sienge.mock
  ? new MockSiengeGateway()
  : new AsyncSiengeGateway({
    baseUrl: env.sienge.baseUrl,
    sienge_user: env.sienge.user,
    sienge_password: env.sienge.password,
    timeoutMs: env.sienge.timeoutMs,
  });

module.exports = { siengeGateway, AsyncSiengeGateway, MockSiengeGateway };
