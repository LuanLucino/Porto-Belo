// Preenche o cabeçalho com os dados do fornecedor pra manter o
// contexto visual entre as telas do fluxo.
function fillHeader() {
    const supplier = getLocalStorage('supplier');
    if (!supplier) return;
    document.getElementById('razao-social-val').textContent = supplier.name ?? '';
    document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
}

// Mostra o código do contrato selecionado pra o usuário confirmar
// que está medindo o contrato certo antes de escolher o item.
function fillContractInfo(contract) {
    document.getElementById('codigo-contrato-val').textContent = contract?.code ?? '';
}

// Renderiza os itens do contrato como linhas de tabela com radio,
// porque cada medição amarra a um único item.
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

// Habilita o botão Próxima só quando houver um item selecionado, pra
// evitar que o usuário avance sem dado obrigatório do payload.
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

// Listener delegado: dispara o updateNextButton quando o radio muda,
// sem precisar amarrar handler em cada linha gerada.
function handleSelectionChange(event) {
    if (!event.target.classList.contains('item-row')) return;
    updateNextButton();
}

// Persiste o item escolhido no localStorage e segue pra próxima etapa;
// o finalize-payment vai usar esse item pra calcular measuredQuantity.
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

// Garante que o contrato tem buildingUnitId; o /supply-contracts/all
// não devolve esse campo, então usamos um fallback fixo no MVP.
async function ensureBuildingUnitId(contract) {
    if (contract.buildingUnitId) return contract;

    const enriched = { ...contract, buildingUnitId: 1 };
    setLocalStorage('selectedContract', enriched);
    return enriched;
}

// Chama o backend pra trazer os itens do contrato; valida os 4
// identificadores obrigatórios antes pra mensagem de erro ser clara.
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

// Orquestra o carregamento da tela: popula header, busca itens e
// liga os listeners de seleção e próxima etapa.
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
