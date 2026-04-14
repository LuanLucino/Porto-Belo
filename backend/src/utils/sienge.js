
function calculateCheckDigit(numbers) {
    let sum = 0;
    let pos = numbers.length - 7;
    for (let i = numbers.length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(numbers.length - i), 10) * pos--;
        if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
}

function hasValidCheckDigits(cnpj) {
    // Rejeita CNPJs com todos os dígitos iguais (ex: 00000000000000) — passam no check mas são inválidos.
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    const first = calculateCheckDigit(cnpj.substring(0, 12));
    const second = calculateCheckDigit(cnpj.substring(0, 12) + first);
    return cnpj.endsWith(`${first}${second}`);
}

function validateCNPJ(raw) {
    const cnpj = String(raw ?? '').replace(/\D/g, '');

    if (!cnpj) {
        return { value: null, error: 'CNPJ é obrigatório.' };
    }
    if (cnpj.length !== 14) {
        return { value: null, error: 'CNPJ deve conter 14 dígitos.' };
    }
    if (!hasValidCheckDigits(cnpj)) {
        return { value: null, error: 'CNPJ inválido.' };
    }

    return { value: cnpj, error: null };
}

module.exports = { validateCNPJ };
