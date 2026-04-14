// Page script for invoice-data.html
// Collects invoice form fields, sends to backend, and navigates to the next step.

async function sendInvoiceData() {
    const invoiceNumber = document.getElementById('numeroNota')?.value || '0';
    const invoiceValue = document.getElementById('valorNotaFiscal')?.value || '0,00';
    const emissionDate = document.getElementById('dataEmissao')?.value || '';

    if (!invoiceNumber || invoiceNumber === '0') {
        alert('Por favor, preencha o número da nota.');
        return;
    }

    try {
        await window.api.post('/save-invoice', {
            invoiceNumber,
            invoiceValue,
            emissionDate,
        });
        window.location.href = './payment-data.html';
    } catch (err) {
        console.error('Erro ao salvar nota:', err);
        alert(err.message);
    }
}
