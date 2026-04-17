

class SiengeControllerUtils {
    static calculateOffset(records) {
        // The services gets the contracts, but it only returns the first 200 records
        // So, in order to get all the contracts, we need to calculate the offset steps
        // Based on the total of records thate comes in the response

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