// Preenche o cabeçalho com dados do fornecedor pra manter contexto
// visual entre as telas do fluxo.
function fillHeader() {
    const supplier = getLocalStorage('supplier');
    if (!supplier) return;
    document.getElementById('razao-social-val').textContent = supplier.name ?? '';
    document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
}

// Formata um número como BRL (R$ 1.234,56); o invoiceValue está em
// localStorage como número puro pra evitar ambiguidade no parse.
function formatBRL(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Monta o resumo da medição criada juntando dados do contrato, NF e
// resposta do Sienge (que traz o número da medição gerada).
function fillSummary() {
    const contract = getLocalStorage('selectedContract');
    const invoice = getLocalStorage('invoiceData');
    const result = getLocalStorage('measurementResult');

    document.getElementById('medicao-id-val').textContent =
        result?.id ?? result?.measurementNumber ?? '—';
    document.getElementById('codigo-contrato-val').textContent = contract?.code ?? '';
    document.getElementById('obra-val').textContent = contract?.constructionName ?? '';
    document.getElementById('valor-val').textContent = formatBRL(invoice?.invoiceValue);
    document.getElementById('numero-nota-val').textContent = invoice?.invoiceNumber ?? '';
    document.getElementById('data-emissao-val').textContent = invoice?.emissionDate ?? '';
    document.getElementById('data-vencimento-val').textContent = invoice?.dueDate ?? '';
}

// Mostra o item medido e a quantidade gerada; tenta ler do retorno
// do Sienge primeiro (mais confiável) antes do cálculo local.
function fillItem() {
    const item = getLocalStorage('selectedItem');
    const measured = getLocalStorage('measurementResult')?.items?.[0]?.measuredQuantity
        ?? getLocalStorage('measuredQuantity');

    document.getElementById('item-descricao-val').textContent = item?.description ?? '';
    document.getElementById('quantidade-medida-val').textContent = measured ?? '';
    document.getElementById('item-unidade-val').textContent = item?.unit ?? '';
}

// Traduz o code interno da forma de pagamento pra rótulo amigável que
// o usuário entende (ticket → Boleto, etc.).
function formatPaymentMethod(forma) {
    switch (forma) {
        case 'transfer': return 'Transferência Eletrônica';
        case 'ticket': return 'Boleto';
        case 'installments': return 'Pagamento Parcelado';
        default: return forma ?? '';
    }
}

// Renderiza só os campos de pagamento que fazem sentido para a forma
// escolhida; as linhas bancárias somem em boleto/parcelado.
function fillPayment() {
    const payment = getLocalStorage('dadosPagamento');
    const supplier = getLocalStorage('supplier');
    if (!payment) return;

    document.getElementById('tipo-pagamento-val').textContent = formatPaymentMethod(payment.forma);
    document.getElementById('nome-favorecido-val').textContent = payment.nomeFavorecido || supplier?.name || '';
    document.getElementById('cpf-cnpj-favorecido-val').textContent = payment.cpfCnpjFavorecido || supplier?.cnpj || '';

    const bankIds = ['banco-val', 'agencia-val', 'conta-val', 'tipo-conta-val'];
    if (payment.forma === 'transfer') {
        document.getElementById('banco-val').textContent = payment.banco ?? '';
        document.getElementById('agencia-val').textContent = payment.agencia ?? '';
        document.getElementById('conta-val').textContent = payment.conta ?? '';
        document.getElementById('tipo-conta-val').textContent = payment.tipoConta ?? '';
        bankIds.forEach(id => { const p = document.getElementById(id)?.parentElement; if (p) p.style.display = ''; });
    } else {
        bankIds.forEach(id => { const p = document.getElementById(id)?.parentElement; if (p) p.style.display = 'none'; });
    }
}

// Avança pra endpage sem limpar o localStorage; a endpage ainda
// precisa do supplier pra renderizar o cabeçalho (limpeza fica lá).
function finalizar() {
    window.location.href = './endpage.html';
}

fillHeader();
fillSummary();
fillItem();
fillPayment();
