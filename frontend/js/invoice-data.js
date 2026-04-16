// Page script for invoice-data.html
// Collects invoice form fields, sends to backend, and navigates to the next step.

let selectedFile = null;

function fillHeader() {
    const supplier = getLocalStorage('supplier');
    if (!supplier) return;
    document.getElementById('razao-social-val').textContent = supplier.name ?? '';
    document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
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
        alert('Por favor, preencha o número da nota.');
        return;
    }

    try {
        await window.api.post('/save-invoice', {
            invoiceNumber,
            invoiceValue,
            emissionDate,
            dueDate,
        });

        // Arquivo fica em memória para o próximo passo (envio ao Sienge)
        if (selectedFile) {
            setLocalStorage('hasInvoiceFile', true);
        }

        window.location.href = './payment-data.html';
    } catch (err) {
        console.error('Erro ao salvar nota:', err);
        alert(err.message);
    }
}

fillHeader();
setupFileInput();
