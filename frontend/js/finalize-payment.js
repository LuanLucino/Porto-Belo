// Page script for finalize-payment.html
// Reúne o que foi coletado nas telas anteriores (supplier, selectedContract,
// invoiceData, dadosPagamento) e submete a medição ao Sienge via /api/create-measurement.
// Após o sucesso da medição, envia o PDF da NF (se anexado) como anexo da medição.

function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

async function uploadInvoiceAttachment(contract, invoice, measurementNumber) {
    const invoiceFile = getLocalStorage('invoiceFile');
    if (!invoiceFile?.dataUrl) return null;
    if (!measurementNumber) return null;

    const blob = dataUrlToBlob(invoiceFile.dataUrl);
    const formData = new FormData();
    formData.append('file', blob, invoiceFile.name);
    formData.append('documentId', contract.documentId);
    formData.append('contractNumber', contract.code);
    formData.append('buildingId', contract.buildingId);
    formData.append('measurementNumber', measurementNumber);
    formData.append('description', `NF ${invoice.invoiceNumber}`.slice(0, 500));

    return window.api.postForm('/send-measurement-attachment', formData);
}

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

    let measurement;
    try {
        const result = await window.api.post(`/create-measurement?${query}`, body);
        measurement = result?.measurement ?? result ?? {};
        setLocalStorage('measurementResult', measurement);
        setLocalStorage('measuredQuantity', measuredQuantity);
    } catch (err) {
        console.error('Erro ao enviar medição:', err);
        alert(err.message);
        return;
    }

    const measurementNumber = measurement.measurementNumber ?? measurement.id ?? measurement.number ?? null;

    try {
        const attachment = await uploadInvoiceAttachment(contract, invoice, measurementNumber);
        if (attachment) setLocalStorage('attachmentResult', attachment);
    } catch (err) {
        console.error('Erro ao enviar anexo da medição:', err);
        alert(`Medição criada, mas o anexo falhou: ${err.message}`);
    }

    window.location.href = './measurement-success.html';
}

fillHeader();
fillSummary();
fillPayment();
