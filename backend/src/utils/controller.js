

class ControllerUtils {
    static filterContractsBySupplierId(contracts, supplierId) {
        const id = Number(supplierId);
        return contracts.filter(contract => Number(contract.supplierId) === id);
    }
}

module.exports = { ControllerUtils };