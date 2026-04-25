// Erro HTTP com status para o middleware de erro do Express devolver
// a resposta certa sem cada controller ter que mapear status na mão.
class HTTPError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'HTTPError';
    }
}

// Funções de tradução entre os formatos crus do Sienge e os schemas
// estáveis que o frontend consome — qualquer mudança no Sienge fica
// confinada aqui, sem espalhar pelo resto do código.
class SiengeUtils {
    // Traduz erros do axios em HTTPError com mensagem útil; também
    // loga o body cru no console para debug rápido em runtime.
    static mapSiengeError(err, fallbackMessage) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        const siengeMsg = data?.developerMessage || data?.clientMessage;
        const details = Array.isArray(data?.errors)
            ? data.errors.map(e => {
                const field = e.fieldName ?? e.field ?? e.parameter ?? e.name ?? '';
                const msg = e.message ?? e.developerMessage ?? JSON.stringify(e);
                return field ? `${field}: ${msg}` : msg;
            }).join('; ')
            : '';
        const fullMsg = [siengeMsg, details].filter(Boolean).join(' — ');

        console.error('[Sienge]', status, err.config?.url, JSON.stringify(data));

        if (status === 404) return null;
        if (status === 400) {
            return new HTTPError(400, fullMsg || 'Requisição inválida.');
        }
        return new HTTPError(502, fullMsg || fallbackMessage);
    }

    // Recorta só os campos do fornecedor que o portal usa, com fallbacks
    // para nomes alternativos que o Sienge eventualmente devolve.
    static adaptSupplier(raw) {
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

    // Normaliza uma conta bancária do fornecedor; concatena
    // accountNumber+checkDigit porque o Sienge separa esses campos.
    static adaptBankInformation(raw) {
        if (!raw) return null;
        const accountFull = [raw.accountNumber, raw.checkDigit].filter(Boolean).join('-');
        return {
            id: raw.id ?? null,
            bankCode: raw.bank ?? raw.bankCode ?? '',
            bankName: raw.nameOfBank ?? raw.bankName ?? '',
            agency: raw.agency ?? '',
            accountNumber: accountFull || raw.accountNumber || '',
            accountType: raw.accountType ?? '',
            holderName: raw.nameOfRecipient ?? raw.holderName ?? '',
            holderDocument: raw.cnpj || raw.cpf || raw.holderDocument || '',
            isDefault: raw.defaultFlag === 'S' || raw.defaultFlag === true,
        };
    }

    // Adapta um contrato de suprimentos; também soma totalLaborValue +
    // totalMaterialValue porque o Sienge não devolve um total único.
    static adaptContract(raw) {
        const firstBuilding = raw.buildings?.[0];
        const totalLaborValue = raw.totalLaborValue ?? 0;
        const totalMaterialValue = raw.totalMaterialValue ?? 0;
        return {
            id: raw.id ?? raw.contractNumber ?? null,
            code: raw.contractNumber ?? raw.code ?? '',
            documentId: raw.documentId ?? raw.documentIdentificationId ?? null,
            contractName: raw.object ?? raw.contractName ?? '',
            constructionName: firstBuilding?.name ?? raw.constructionName ?? '',
            technicalRetention: raw.technicalRetention ?? '',
            totalLaborValue,
            totalMaterialValue,
            totalValue: totalLaborValue + totalMaterialValue,
            supplierId: raw.creditorId ?? raw.supplierId ?? null,
            buildingId: firstBuilding?.buildingId ?? null,
            buildingUnitId: firstBuilding?.buildingUnitId
                ?? firstBuilding?.unitId
                ?? firstBuilding?.units?.[0]?.id
                ?? firstBuilding?.units?.[0]?.buildingUnitId
                ?? null,
            buildingName: firstBuilding?.name ?? '',
        };
    }

    // Resolve o buildingUnitId do contrato testando vários nomes de
    // campo possíveis; o Sienge não documenta qual chave usa.
    static adaptContractBuilding(raw) {
        if (!raw) return null;
        return {
            buildingId: raw.buildingId ?? raw.id ?? null,
            name: raw.name ?? raw.buildingName ?? '',
            buildingUnitId: raw.buildingUnitId
                ?? raw.unitId
                ?? raw.buildingUnits?.[0]?.id
                ?? raw.buildingUnits?.[0]?.buildingUnitId
                ?? raw.units?.[0]?.id
                ?? raw.units?.[0]?.buildingUnitId
                ?? null,
            buildingUnits: Array.isArray(raw.buildingUnits) ? raw.buildingUnits
                : Array.isArray(raw.units) ? raw.units
                : [],
        };
    }

    // Achata um item de contrato pro shape que a tela de itens usa, já
    // calculando totalPrice e extraindo o buildingUnitId aninhado.
    static adaptContractItem(raw) {
        if (!raw) return null;
        const firstAppropriation = raw.buildingAppropriations?.[0];
        const quantity = raw.quantity ?? 0;
        const laborPrice = raw.laborPrice ?? 0;
        const materialPrice = raw.materialPrice ?? 0;
        const unitPrice = laborPrice + materialPrice;
        return {
            id: raw.id ?? null,
            description: raw.description ?? '',
            quantity,
            unit: raw.unitOfMeasure ?? '',
            laborPrice,
            materialPrice,
            unitPrice,
            totalPrice: unitPrice * quantity,
            buildingUnitId: firstAppropriation?.buildingUnitId ?? null,
            sheetItemId: firstAppropriation?.sheetItemId ?? null,
            wbsCode: raw.wbsCode ?? '',
        };
    }

    // Atalho para criar um HTTPError sem precisar instanciar a classe;
    // usado quando o gateway quer abortar com um status específico.
    static httpError(statusCode, message) {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
    }
}

module.exports = { SiengeUtils, HTTPError };
