function fillHeader() {
    try {
        const supplier = JSON.parse(localStorage.getItem('supplier'));
        if (!supplier) return;
        document.getElementById('razao-social-val').textContent  = supplier.name      ?? '';
        document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
        document.getElementById('cnpj-val').textContent          = supplier.cnpj      ?? '';
    } catch (e) {
        console.error('Erro ao preencher cabeçalho:', e);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fillHeader();
});

function voltaraoinicio() {
    [
        'supplier',
        'supplierBankInfo',
        'selectedContract',
        'selectedItem',
        'invoiceData',
        'invoiceFile',
        'boletoFile',
        'dadosPagamento',
        'measurementResult',
        'measuredQuantity',
        'attachmentResult',
        'boletoAttachmentResult',
    ].forEach(key => localStorage.removeItem(key));
    window.location.href = './home.html';
}
