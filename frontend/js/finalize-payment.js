// Converte uma data URL (base64) de volta para Blob; necessário pra
// reidratar o arquivo persistido em localStorage e enviar via FormData.
function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

// Helper genérico que envia um arquivo (NF ou boleto) como anexo de
// uma medição já criada; o Sienge aceita um anexo por chamada.
async function uploadAttachment(contract, measurementNumber, fileEntry, description) {
    if (!fileEntry?.dataUrl) return null;
    if (!measurementNumber) return null;

    const blob = dataUrlToBlob(fileEntry.dataUrl);
    const formData = new FormData();
    formData.append('file', blob, fileEntry.name);
    formData.append('documentId', contract.documentId);
    formData.append('contractNumber', contract.code);
    formData.append('buildingId', contract.buildingId);
    formData.append('measurementNumber', measurementNumber);
    formData.append('description', String(description ?? '').slice(0, 500));

    return window.api.postForm('/send-measurement-attachment', formData);
}

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
// localStorage como número puro pra evitar ambiguidade na hora do parse.
function formatBRL(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Mostra o resumo de contrato + NF coletados ao longo do fluxo, pra
// o usuário conferir antes de confirmar o envio ao Sienge.
function fillSummary() {
    const contract = getLocalStorage('selectedContract');
    const invoice = getLocalStorage('invoiceData');

    document.getElementById('codigo-contrato-val').textContent = contract?.code ?? '';
    document.getElementById('valor-val').textContent = formatBRL(invoice?.invoiceValue);
    document.getElementById('numero-nota-val').textContent = invoice?.invoiceNumber ?? '';
    document.getElementById('data-emissao-val').textContent = invoice?.emissionDate ?? '';
    document.getElementById('data-vencimento-val').textContent = invoice?.dueDate ?? '';
}

// Traduz o code interno da forma de pagamento pra o rótulo amigável
// que o usuário entende (ticket → Boleto, etc.).
function formatPaymentMethod(forma) {
    switch (forma) {
        case 'transfer': return 'Transferência Eletrônica';
        case 'ticket': return 'Boleto';
        case 'installments': return 'Pagamento Parcelado';
        default: return forma ?? '';
    }
}

// Mostra os campos de pagamento aplicáveis; campos bancários só
// aparecem quando a forma é transferência, pra não confundir o usuário.
function fillPayment() {
    const payment = getLocalStorage('dadosPagamento');
    const supplier = getLocalStorage('supplier');
    if (!payment) return;

    document.getElementById('tipo-pagamento-val').textContent = formatPaymentMethod(payment.forma);
    document.getElementById('nome-favorecido-val').textContent = payment.nomeFavorecido || supplier?.name || '';
    document.getElementById('cpf-cnpj-favorecido-val').textContent = payment.cpfCnpjFavorecido || supplier?.cnpj || '';

    const bankRows = document.getElementById('bank-info-rows');
    if (payment.forma === 'transfer') {
        bankRows.style.display = '';
        document.getElementById('banco-val').textContent = payment.banco ?? '';
        document.getElementById('agencia-val').textContent = payment.agencia ?? '';
        document.getElementById('conta-val').textContent = payment.conta ?? '';
        document.getElementById('tipo-conta-val').textContent = payment.tipoConta ?? '';
    } else {
        bankRows.style.display = 'none';
    }
}

// Cria a medição no Sienge e, em seguida, anexa NF e boleto se houver;
// falhas em anexos são reportadas mas não bloqueiam ir pra success.
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
    const failures = [];

    try {
        const invoiceFile = getLocalStorage('invoiceFile');
        const result = await uploadAttachment(contract, measurementNumber, invoiceFile, `NF ${invoice.invoiceNumber}`);
        if (result) setLocalStorage('attachmentResult', result);
    } catch (err) {
        console.error('Erro ao enviar anexo da NF:', err);
        failures.push(`NF: ${err.message}`);
    }

    if (getLocalStorage('dadosPagamento')?.forma === 'ticket') {
        try {
            const boletoFile = getLocalStorage('boletoFile');
            const result = await uploadAttachment(contract, measurementNumber, boletoFile, `Boleto NF ${invoice.invoiceNumber}`);
            if (result) setLocalStorage('boletoAttachmentResult', result);
        } catch (err) {
            console.error('Erro ao enviar anexo do boleto:', err);
            failures.push(`Boleto: ${err.message}`);
        }
    }

    if (failures.length) {
        alert(`Medição criada, mas alguns anexos falharam: ${failures.join('; ')}`);
    }

    window.location.href = './measurement-success.html';
}

// Abre o anexo numa nova aba dentro de um iframe; suporta tanto PDF
// quanto imagem porque o data URL carrega o mimetype original.
function openAttachmentPreview(file) {
    const win = window.open();
    if (!win) return;
    win.document.write(
        `<iframe src="${file.dataUrl}" width="100%" height="100%" style="border:0"></iframe>`
    );
}

// Lista os anexos disponíveis (NF sempre, boleto só se forma=ticket)
// e dá um botão "Visualizar" pra cada um abrir em prévia.
function renderAttachments() {
    const container = document.getElementById('attachmentsList');
    if (!container) return;
    container.innerHTML = '';

    const files = [];
    const invoiceFile = getLocalStorage('invoiceFile');
    if (invoiceFile?.dataUrl) files.push({ label: 'Nota Fiscal', file: invoiceFile });

    if (getLocalStorage('dadosPagamento')?.forma === 'ticket') {
        const boletoFile = getLocalStorage('boletoFile');
        if (boletoFile?.dataUrl) files.push({ label: 'Boleto', file: boletoFile });
    }

    if (!files.length) {
        container.textContent = 'Nenhum anexo.';
        return;
    }

    files.forEach(({ label, file }) => {
        const row = document.createElement('div');
        row.className = 'flex items-center';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rounded px-4 py-1 text-sm bg-secondary text-white hover:bg-secondary-hover';
        btn.style.marginRight = '16px';
        btn.textContent = 'Visualizar';
        btn.addEventListener('click', () => openAttachmentPreview(file));

        const text = document.createElement('span');
        text.className = 'ml-4';
        text.textContent = `${label}: ${file.name}`;

        row.appendChild(btn);
        row.appendChild(text);
        container.appendChild(row);
    });
}

fillHeader();
fillSummary();
fillPayment();
renderAttachments();
