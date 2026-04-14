// Finish this file with the CNPJ validation functions and export them later

function formatCNPJ(cnpj) {
    const cleanedCNPJ = cnpj.replace(/\D/g, '');
    return cleanedCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}


function cnpjErrorHandler(cnpj) {
    const cnpjLength = cnpj.length;
    const cleanedCNPJ = formatCNPJ(cnpj);
    if (cnpjLength === 0) {
        return 'CNPJ é obrigatório.';
    }
    if (typeof cnpj !== 'string') {
        return 'CNPJ deve ser uma string.';
    }
    if (cnpjLength !== 14) {
        return 'CNPJ deve conter 14 dígitos.';
    }
    return null; // No error

}

function isValidCNPJ(cnpj) {
    // This function validates the CNPJ calculation 
    const cnpjNumbers = cnpj.replace(/\D/g, '');
    if (cnpjNumbers.length !== 14) return false;

    const calculateCheckDigit = (numbers) => {
        let sum = 0;
        let pos = numbers.length - 7;
        for (let i = numbers.length; i >= 1; i--) {
            sum += parseInt(numbers.charAt(numbers.length - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return result;
    };

    const firstCheckDigit = calculateCheckDigit(cnpjNumbers.substring(0, 12));
    const secondCheckDigit = calculateCheckDigit(cnpjNumbers.substring(0, 12) + firstCheckDigit);

    return cnpjNumbers.endsWith(`${firstCheckDigit}${secondCheckDigit}`);
}