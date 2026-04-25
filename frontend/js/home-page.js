// Mostra um toast temporário no canto da tela; usado para validação
// de CNPJ e mensagens de erro de chamadas à API.
function showMessage(text, type = 'info') {
    const box = document.getElementById('message');
    box.textContent = text;
    box.className = 'message-box ' + type;
    box.style.display = 'block';

    setTimeout(() => {
        box.style.display = 'none';
    }, 3000);
}

// Calcula um dígito verificador do CNPJ (Mod 11). Usado duas vezes
// na verificação completa pra recriar e bater o checksum oficial.
function calculateCheckDigit(numbers) {
    let sum = 0;
    let pos = numbers.length - 7;
    for (let i = numbers.length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(numbers.length - i), 10) * pos--;
        if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
}

// Valida os dois dígitos verificadores oficiais do CNPJ; também
// rejeita sequências repetidas (00...0, 11...1) que passariam no Mod 11.
function hasValidCheckDigits(cnpj) {
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    const first = calculateCheckDigit(cnpj.substring(0, 12));
    const second = calculateCheckDigit(cnpj.substring(0, 12) + first);
    return cnpj.endsWith(`${first}${second}`);
}

// Normaliza e valida o CNPJ digitado antes de gastar uma chamada de
// rede; devolve { value, error } pra o caller decidir o feedback.
function validateCNPJ(raw) {
    const cnpj = String(raw ?? '').replace(/\D/g, '');
    if (!cnpj) return { value: null, error: 'CNPJ é obrigatório.' };
    if (cnpj.length !== 14) return { value: null, error: 'CNPJ deve conter 14 dígitos.' };
    if (!hasValidCheckDigits(cnpj)) return { value: null, error: 'CNPJ inválido.' };

    return { value: cnpj, error: null };
}

// Pré-carrega as contas bancárias do fornecedor já no home, pra que a
// tela de pagamento possa sugerir sem outra chamada à rede no meio do fluxo.
async function prefetchBankInformations(supplierId) {
    if (!supplierId) return;
    try {
        const data = await window.api.get(`/get-supplier-bank-info?supplierId=${encodeURIComponent(supplierId)}`);
        setLocalStorage('supplierBankInfo', data?.bankInformations ?? []);
    } catch (err) {
        console.warn('Não foi possível pré-carregar dados bancários do fornecedor:', err);
        localStorage.removeItem('supplierBankInfo');
    }
}

// Handler do botão Entrar do home: valida o CNPJ, busca o fornecedor,
// pré-carrega os bancos e, se tudo der certo, avança para os contratos.
async function sendCNPJ() {
    const inputCNPJ = document.getElementById('cnpj').value;

    const { value: typedCNPJ, error } = validateCNPJ(inputCNPJ);

    if (error) {
        showMessage(error);
        return;
    }

    try {
        const data = await window.api.get('/get-supplier?cnpj=' + encodeURIComponent(typedCNPJ));

        if (!data || !data.supplierData) {
            showMessage('CNPJ não cadastrado no Sienge. Entre em contato com o suporte.');
            return;
        }

        setLocalStorage('supplier', data.supplierData);

        await prefetchBankInformations(data.supplierData.id);

        window.location.href = './choose-contract.html';
    } catch (err) {
        console.error('Erro ao consultar CNPJ:', err);

        if (err.message.includes('not found')) {
            showMessage('CNPJ não cadastrado no Sienge. Entre em contato com o suporte.');
        } else {
            showMessage(err.message);
        }
    }
}
