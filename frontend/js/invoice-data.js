// Page script for invoice-data.html
// Lê o contrato selecionado na etapa anterior, coleta os dados da NF
// e persiste em localStorage para uso na etapa final (criação da medição no Sienge).

let selectedFile = null;

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
        alert('Nenhum contrato selecionado. Volte e selecione um contrato.');
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

function sendInvoiceData() {
    const invoiceNumber = document.getElementById('numeroNota')?.value || '';
    const invoiceValue = document.getElementById('valorNotaFiscal')?.value || '';
    const emissionDate = document.getElementById('dataEmissao')?.value || '';
    const dueDate = document.getElementById('dataVencimento')?.value || '';

    if (!invoiceNumber) {
        alert('Por favor, preencha o número da nota.');
        return;
    }
    if (!invoiceValue) {
        alert('Por favor, preencha o valor da nota.');
        return;
    }

    setLocalStorage('invoiceData', {
        invoiceNumber,
        invoiceValue,
        emissionDate,
        dueDate,
        hasFile: !!selectedFile,
    });

    window.location.href = './payment-data.html';
}

fillHeader();
fillContractInfo();
setupFileInput();
