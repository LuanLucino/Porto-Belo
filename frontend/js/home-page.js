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
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    const first = calculateCheckDigit(cnpj.substring(0, 12));
    const second = calculateCheckDigit(cnpj.substring(0, 12) + first);
    return cnpj.endsWith(`${first}${second}`);
}

function validateCNPJ(raw) {
    const cnpj = String(raw ?? '').replace(/\D/g, '');
    if (!cnpj) return { value: null, error: 'CNPJ é obrigatório.' };

    if (cnpj.length !== 14) return { value: null, error: 'CNPJ deve conter 14 dígitos.' };

    if (!hasValidCheckDigits(cnpj)) return { value: null, error: 'CNPJ inválido.' };

    return { value: cnpj, error: null };
}

/*async function sendCNPJ() {
    const inputCNPJ = document.getElementById('cnpj').value;
    const { value: typedCNPJ, error } = validateCNPJ(inputCNPJ);

    if (error) {
        alert(error);
        return;
    }

    try {
        const data = await window.api.get('/get-supplier?cnpj=' + encodeURIComponent(typedCNPJ));
        localStorage.setItem('supplier', JSON.stringify(data.supplierData));
        window.location.href = './choose-contract.html';
    } catch (err) {
        console.error('Erro ao consultar CNPJ:', err);
        alert(err.message);
    }
}*/


async function sendCNPJ() {
    const inputCNPJ = document.getElementById('cnpj').value;

    
    const { value: typedCNPJ, error } = validateCNPJ(inputCNPJ); // Valida o CNPJ digitado 

    if (error) {
        alert(error); // Exemplo: "CNPJ inválido."
        return;       // Para aqui, não continua para a consulta na API
    }

    try {
        // Faz a requisição para a API, passando o CNPJ validado
        const data = await window.api.get('/get-supplier?cnpj=' + encodeURIComponent(typedCNPJ));

        // CNPJ sem cadastro no Sienge
        // Se não houver dados retornados ou não existir supplierData, significa que não está cadastrado
        if (!data || !data.supplierData) {
            alert('CNPJ não cadastrado no Sienge. Entre em contato com o suporte.');
            return; // Para aqui, não continua para salvar nem redirecionar
        }

        // CNPJ Valido
        // Armazena os dados do fornecedor no navegador (localStorage)
        localStorage.setItem('supplier', JSON.stringify(data.supplierData));

        // Redireciona o usuário para a próxima página
        window.location.href = './choose-contract.html';
    } catch (err) {
        // Caso ocorra algum erro na consulta (problema de servidor, rede, etc.)
        console.error('Erro ao consultar CNPJ:', err);

        //  Se a mensagem de erro indicar "not found", significa que não está cadastrado no Sienge
        if (err.message.includes('not found')) {
            alert('CNPJ não cadastrado no Sienge. Entre em contato com o suporte.');
        } else {
            // Para outros erros técnicos, mostra mensagem genérica com detalhes
            alert(err.message);
        }
    }
}
