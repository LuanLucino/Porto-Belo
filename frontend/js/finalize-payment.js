// Page script for finalize-payment.html
// Reúne o que foi coletado nas telas anteriores (supplier, selectedContract,
// invoiceData, dadosPagamento) e submete a medição ao Sienge via /api/create-measurement.

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

    document.getElementById('codigo-contrato-val').textContent = contract?.code ?? '';
    document.getElementById('valor-val').textContent = invoice?.invoiceValue ?? '';
    document.getElementById('numero-nota-val').textContent = invoice?.invoiceNumber ?? '';
    document.getElementById('data-emissao-val').textContent = invoice?.emissionDate ?? '';
    document.getElementById('data-vencimento-val').textContent = invoice?.dueDate ?? '';
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

async function enviarMedicao() {
    const contract = getLocalStorage('selectedContract');
    const invoice = getLocalStorage('invoiceData');
    const item = getLocalStorage('selectedItem');

    if (!contract || !invoice || !item) {
        alert('Dados incompletos. Volte e preencha as etapas anteriores.');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const invoiceValue = parseFloat(invoice.invoiceValue) || 0;
    const measuredQuantity = toSiengeQuantity(invoiceValue, contract.totalValue);

    if (!measuredQuantity) {
        alert(`Não foi possível calcular a quantidade medida (valorNF=${invoiceValue}, totalContrato=${contract.totalValue}).`);
        return;
    }

    const body = {
        measurementDate: invoice.emissionDate || today,
        dueDate: invoice.dueDate,
        notes: `NF ${invoice.invoiceNumber}`,
        items: [
            {
                buildingUnitId: item.buildingUnitId,
                itemId: item.id,
                measuredQuantity,
            },
        ],
    };

    if (!contract.documentId || !contract.code || !contract.buildingId) {
        alert(`Contrato sem dados completos (documentId=${contract.documentId}, contractNumber=${contract.code}, buildingId=${contract.buildingId}).`);
        return;
    }

    const query = new URLSearchParams({
        documentId: contract.documentId,
        contractNumber: contract.code,
        buildingId: contract.buildingId,
    });

    try {
        const result = await window.api.post(`/create-measurement?${query}`, body);
        setLocalStorage('measurementResult', result?.measurement ?? result ?? {});
        setLocalStorage('measuredQuantity', measuredQuantity);
        window.location.href = './measurement-success.html';
    } catch (err) {
        console.error('Erro ao enviar medição:', err);
        alert(err.message);
    }
}

fillHeader();
fillSummary();
fillPayment();
