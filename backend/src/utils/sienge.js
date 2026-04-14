class HTTPError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'HTTPError';
    }
}

class SiengeUtils {
    static mapSiengeError(err, fallbackMessage = 'Erro no Sienge') {
        const status = err?.response?.status;
        const siengeMsg =
            err?.response?.data?.developerMessage ||
            err?.response?.data?.clientMessage;

        if (status === 404) return null;

        if (status === 400) {
            return new HTTPError(400, siengeMsg || 'Requisição inválida.');
        }

        return new HTTPError(status || 500, siengeMsg || fallbackMessage);
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
        if (!raw) return null;

        return {
            id: raw.id ?? raw.contractNumber ?? null,
            companyName: raw.companyName ?? '',
            companyId: raw.companyId ?? null,
            supplierName: raw.supplierName ?? raw.creditorName ?? '',
            supplierId: raw.supplierId ?? raw.creditorId ?? null,
            description: raw.description ?? '',
        };
    }

    static adaptCompany(raw) {
        const dataFromSienge = raw?.results || [];

        return dataFromSienge.map(company => ({
            id: company.id,
            name: company.name,
            cnpj: company.cnpj,
            tradeName: company.tradeName,
        }));
    }

}

module.exports = { SiengeUtils };