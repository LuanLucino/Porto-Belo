class HTTPError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'HTTPError';
    }
}

class SiengeUtils {
    static mapSiengeError(err, fallbackMessage) {
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

    static adaptContract(raw) {
        return {
            id: raw.id ?? raw.contractNumber ?? null,
            code: raw.contractNumber ?? raw.code ?? '',
            contractName: raw.object ?? raw.contractName ?? '',
            constructionName: raw.buildings?.[0]?.name ?? raw.constructionName ?? '',
            technicalRetention: raw.technicalRetention ?? '',
            supplierId: raw.creditorId ?? raw.supplierId ?? null,
            // In a contract record, the supplier can only be in one building
            // So i take the first one if it exists
            buildingId: raw.buildings?.[0]?.buildingId ?? null,
            buildingName: raw.buildings?.[0]?.name ?? '',
        };
    }

    static adaptContractItems(raw) {
        return {

        }
    }


    static httpError(statusCode, message) {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
    }

}

module.exports = { SiengeUtils, HTTPError };