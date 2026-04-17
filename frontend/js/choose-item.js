// Page script for choose-item.html
// Lê o contrato selecionado na etapa anterior, busca os itens no Sienge
// e persiste o item escolhido em localStorage para a etapa de medição.

function fillHeader() {
    const supplier = getLocalStorage('supplier');
    if (!supplier) return;
    document.getElementById('razao-social-val').textContent = supplier.name ?? '';
    document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
}

function fillContractInfo(contract) {
    document.getElementById('codigo-contrato-val').textContent = contract?.code ?? '';
}

function renderTable(items) {
    const tbody = document.getElementById('tabela-itens-body');
    tbody.innerHTML = '';
    items.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="radio" name="item-selecionado" class="item-row" data-index="${index}"></td>
            <td class="text-start">${item.description ?? ''}</td>
            <td>${item.quantity ?? ''}</td>
            <td>${item.unit ?? ''}</td>
            <td>${item.unitPrice ?? ''}</td>
            <td>${item.totalPrice ?? ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateNextButton() {
    const nextButton = document.getElementById('btn-proxima');
    const hasSelection = document.querySelectorAll('.item-row:checked').length > 0;

    if (hasSelection) {
        nextButton.classList.add('btn-active');
        nextButton.disabled = false;
    } else {
        nextButton.classList.remove('btn-active');
        nextButton.disabled = true;
    }
}

function handleSelectionChange(event) {
    if (!event.target.classList.contains('item-row')) return;
    updateNextButton();
}

function buildGoToNextStep(items) {
    return function goToNextStep() {
        const checked = document.querySelector('.item-row:checked');
        if (!checked) return;

        const idx = checked.getAttribute('data-index');
        const selectedItem = items[idx];

        setLocalStorage('selectedItem', selectedItem);
        window.location.href = 'invoice-data.html';
    };
}

async function ensureBuildingUnitId(contract) {
    if (contract.buildingUnitId) return contract;

    // TODO: trocar o hardcode por chamada ao /get-contract-buildings
    // quando o shape da resposta estiver confirmado.
    const enriched = { ...contract, buildingUnitId: 1 };
    setLocalStorage('selectedContract', enriched);
    return enriched;
}

async function fetchContractItems(contract) {
    if (!contract.documentId || !contract.code || !contract.buildingId || !contract.buildingUnitId) {
        throw new Error(
            `Dados do contrato incompletos para consulta (documentId=${contract.documentId}, contractNumber=${contract.code}, buildingId=${contract.buildingId}, buildingUnitId=${contract.buildingUnitId}).`
        );
    }
    const query = new URLSearchParams({
        documentId: contract.documentId,
        contractNumber: contract.code,
        buildingId: contract.buildingId,
        buildingUnitId: contract.buildingUnitId,
    });
    const data = await window.api.get(`/get-contract-items?${query}`);
    return data?.contractItems ?? [];
}

async function init() {
    fillHeader();

    let contract = getLocalStorage('selectedContract');
    if (!contract) {
        alert('Nenhum contrato selecionado. Volte e selecione um contrato.');
        return;
    }
    fillContractInfo(contract);

    let items = [];
    try {
        contract = await ensureBuildingUnitId(contract);
        items = await fetchContractItems(contract);
    } catch (err) {
        console.error('Erro ao carregar itens do contrato:', err);
        alert(err.message);
        return;
    }

    if (items.length === 0) {
        alert('Nenhum item encontrado para este contrato.');
        return;
    }

    renderTable(items);
    document.addEventListener('change', handleSelectionChange);
    document.getElementById('btn-proxima').addEventListener('click', buildGoToNextStep(items));
}

init();
