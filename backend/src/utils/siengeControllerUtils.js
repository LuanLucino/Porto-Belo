class SiengeControllerUtils {
    // Calcula os pares offset/limit necessários para paginar através de
    // todos os registros, já que o Sienge limita cada página a 200.
    static calculateOffset(records) {
        const offsetSteps = [];
        const totalRecords = records.resultSetMetadata.count;
        const pageSize = 200;

        if (totalRecords <= pageSize) {
            return [{ offset: 0, limit: totalRecords }];
        }

        const steps = Math.ceil(totalRecords / pageSize);

        for (let i = 0; i < steps; i++) {
            const offset = i * pageSize;
            const remaining = totalRecords - offset;
            const limit = Math.min(pageSize, remaining);

            offsetSteps.push({ offset, limit });
        }

        return offsetSteps;
    }
}

module.exports = { SiengeControllerUtils };
