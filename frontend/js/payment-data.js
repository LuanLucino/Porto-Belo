// Page script for payment-data.html
// Preenche o header com o fornecedor e coleta os dados bancários,
// persistindo em localStorage para uso na etapa final.

function fillHeader() {
    const supplier = getLocalStorage('supplier');
    if (!supplier) return;
    document.getElementById('razao-social-val').textContent = supplier.name ?? '';
    document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
}

function prosseguirParaFinalizar() {
    const dadosPagamento = {
        banco: document.getElementById('bankCode')?.value || '',
        agencia: document.getElementById('agencia')?.value || '',
        conta: document.getElementById('conta')?.value || '',
        forma: document.getElementById('payment_method')?.value || 'boleto',
        tipoConta: document.getElementById('typeAccount')?.value || '',
        tipoFavorecido: document.getElementById('typePerson')?.value || '',
        nomeFavorecido: document.getElementById('nomeFavorecido')?.value || '',
        cpfCnpjFavorecido: document.getElementById('cpfCnpjFavorecido')?.value || '',
    };

    setLocalStorage('dadosPagamento', dadosPagamento);
    window.location.href = './finalize-payment.html';
}

fillHeader();
