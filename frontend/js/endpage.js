function voltaraoinicio() {
    [
        'supplier',
        'selectedContract',
        'selectedItem',
        'invoiceData',
        'invoiceFile',
        'dadosPagamento',
        'measurementResult',
        'measuredQuantity',
        'attachmentResult',
    ].forEach(key => localStorage.removeItem(key));
    window.location.href = './home.html';
}