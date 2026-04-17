// Page script for measurement-success.html
// Lê tudo do localStorage (incluindo a resposta do Sienge gravada pelo finalize-payment)
// e mostra um resumo consolidado. Ao clicar em Finalizar, limpa o estado e volta pra home.

function fillHeader() {
    const supplier = getLocalStorage('supplier');
    if (!supplier) return;
    document.getElementById('razao-social-val').textContent = supplier.name ?? '';
    document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
}

function fillSummary() {
    const contract = getLocalStorage('selectedContract');
    const invoice = getLocalStorage('invoiceData');
    const result = getLocalStorage('measurementResult');

    document.getElementById('medicao-id-val').textContent =
        result?.id ?? result?.measurementNumber ?? '—';
    document.getElementById('codigo-contrato-val').textContent = contract?.code ?? '';
    document.getElementById('obra-val').textContent = contract?.constructionName ?? '';
    document.getElementById('valor-val').textContent = invoice?.invoiceValue ?? '';
    document.getElementById('numero-nota-val').textContent = invoice?.invoiceNumber ?? '';
    document.getElementById('data-emissao-val').textContent = invoice?.emissionDate ?? '';
    document.getElementById('data-vencimento-val').textContent = invoice?.dueDate ?? '';
}

function fillItem() {
    const item = getLocalStorage('selectedItem');
    const measured = getLocalStorage('measurementResult')?.items?.[0]?.measuredQuantity
        ?? getLocalStorage('measuredQuantity');

    document.getElementById('item-descricao-val').textContent = item?.description ?? '';
    document.getElementById('quantidade-medida-val').textContent = measured ?? '';
    document.getElementById('item-unidade-val').textContent = item?.unit ?? '';
}

function fillPayment() {
    const payment = getLocalStorage('dadosPagamento');
    const supplier = getLocalStorage('supplier');
    if (!payment) return;

    document.getElementById('tipo-pagamento-val').textContent = payment.forma ?? '';
    document.getElementById('nome-favorecido-val').textContent = payment.nomeFavorecido || supplier?.name || '';
    document.getElementById('cpf-cnpj-favorecido-val').textContent = payment.cpfCnpjFavorecido || supplier?.cnpj || '';
    document.getElementById('banco-val').textContent = payment.banco ?? '';
    document.getElementById('agencia-val').textContent = payment.agencia ?? '';
    document.getElementById('conta-val').textContent = payment.conta ?? '';
    document.getElementById('tipo-conta-val').textContent = payment.tipoConta ?? '';
}

function finalizar() {
    ['supplier', 'selectedContract', 'selectedItem', 'invoiceData', 'dadosPagamento', 'measurementResult', 'measuredQuantity']
        .forEach(key => localStorage.removeItem(key));
    window.location.href = './home.html';
}

fillHeader();
fillSummary();
fillItem();
fillPayment();
