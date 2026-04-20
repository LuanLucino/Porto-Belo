// NOTIFICAÇÕES: função que exibe mensagens usando as classes do preload.css (message-box)
// Tipos disponíveis: 'error' (vermelho), 'warning' (amarelo), 'success' (verde), 'info' (vermelho)
function showMessage(message, type = 'error', duration = 4000) {
    const box = document.getElementById('message-box');
    box.textContent = message;
    box.className = `message-box ${type}`;
    box.style.display = 'block';
    setTimeout(() => {
        box.style.display = 'none';
    }, duration);
}

let selectedFile = null;

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function fillHeader() {
    const supplier = getLocalStorage('supplier');
    if (!supplier) return;
    document.getElementById('razao-social-val').textContent = supplier.name ?? '';
    document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
}

function fillContractInfo() {
    const contract = getLocalStorage('selectedContract');
    if (!contract) {
        // NOTIFICAÇÕES: substituído alert() por showMessage()
        showMessage('Nenhum contrato selecionado. Volte e selecione um contrato.', 'error');
        return;
    }
    document.getElementById('codigo-contrato-val').textContent = contract.code ?? '';
}

function setupFileInput() {
    document.getElementById('invoiceFile').addEventListener('change', (e) => {
        selectedFile = e.target.files[0] || null;
        document.getElementById('fileName').textContent = selectedFile ? selectedFile.name : '';
    });
}

async function sendInvoiceData() {
    const invoiceNumber = document.getElementById('numeroNota')?.value || '';
    const invoiceValue = document.getElementById('valorNotaFiscal')?.value || '';
    const emissionDate = document.getElementById('dataEmissao')?.value || '';
    const dueDate = document.getElementById('dataVencimento')?.value || '';

    if (!invoiceNumber) {
        // NOTIFICAÇÕES: substituído alert() por showMessage()
        showMessage('Por favor, preencha o número da nota.', 'error');
        return;
    }
    // CAMPO OBRIGATÓRIO: validação da data de emissão
    if (!emissionDate) {
        // NOTIFICAÇÕES: substituído alert() por showMessage()
        showMessage('Por favor, preencha a data de emissão.', 'error');
        return;
    }
    // CAMPO OBRIGATÓRIO: validação da data de vencimento
    if (!dueDate) {
        // NOTIFICAÇÕES: substituído alert() por showMessage()
        showMessage('Por favor, preencha a data de vencimento.', 'error');
        return;
    }
    if (!invoiceValue) {
        // NOTIFICAÇÕES: substituído alert() por showMessage()
        showMessage('Por favor, preencha o valor da nota.', 'error');
        return;
    }

    // CAMPO OBRIGATÓRIO: validação do anexo da nota fiscal
    if (!selectedFile) {
        // NOTIFICAÇÕES: substituído alert() por showMessage()
        showMessage('Por favor, anexe a nota fiscal.', 'error');
        return;
    }

    setLocalStorage('invoiceData', {
        invoiceNumber,
        invoiceValue,
        emissionDate,
        dueDate,
        hasFile: !!selectedFile,
    });

    if (selectedFile) {
        try {
            const dataUrl = await fileToBase64(selectedFile);
            setLocalStorage('invoiceFile', {
                name: selectedFile.name,
                type: selectedFile.type,
                dataUrl,
            });
        } catch (err) {
            console.error('Falha ao ler o arquivo da NF:', err);
            // NOTIFICAÇÕES: substituído alert() por showMessage()
            showMessage('Não foi possível ler o arquivo anexado. Tente novamente.', 'error');
            return;
        }
    } else {
        localStorage.removeItem('invoiceFile');
    }

    window.location.href = './payment-data.html';
}

fillHeader();
fillContractInfo();
setupFileInput();
