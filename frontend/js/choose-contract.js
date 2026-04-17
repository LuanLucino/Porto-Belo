// Page script for choose-contract.html
// Supplier comes from localStorage (saved by home-page.js).
// Contracts are fetched from the backend (GET /get-contracts).

function getSupplierFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('supplier'));
    } catch {
        return null;
    }
}

function fillHeader(supplier) {
    if (!supplier) return;
    document.getElementById('razao-social-val').textContent = supplier.name ?? '';
    document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
}

function renderTable(contracts) {
    const tbody = document.getElementById('tabela-contratos-body');
    tbody.innerHTML = '';
    contracts.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="radio" name="contrato-selecionado" class="contrato-item" data-index="${index}"></td>
            <td class="text-start">${item.constructionName ?? ''}</td>
            <td>${item.contractName ?? ''}</td>
            <td>${item.code ?? ''}</td>
            <td class="bg-primary text-white">${item.technicalRetention ?? ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateNextButton() {
    const nextButton = document.getElementById('btn-proxima');
    const hasSelection = document.querySelectorAll('.contrato-item:checked').length > 0;

    if (hasSelection) {
        nextButton.classList.add('btn-active');
        nextButton.disabled = false;
    } else {
        nextButton.classList.remove('btn-active');
        nextButton.disabled = true;
    }
}

function handleSelectionChange(event) {
    if (!event.target.classList.contains('contrato-item')) return;
    updateNextButton();
}

function buildGoToNextStep(contracts) {
    return function goToNextStep() {
        const checked = document.querySelector('.contrato-item:checked');
        if (!checked) return;

        const idx = checked.getAttribute('data-index');
        const selectedContract = contracts[idx];

        setLocalStorage('selectedContract', selectedContract);
        window.location.href = 'choose-item.html';
    };
}

async function getSupplierContracts(supplierId) {
    const cacheKey = 'supplierContracts_' + supplierId;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const data = await window.api.get('/get-contracts?supplierId=' + encodeURIComponent(supplierId));
    const contracts = data?.supplierContracts ?? [];
    setCachedData(cacheKey, contracts, 15);
    return contracts;
}

async function init() {
    const supplier = getSupplierFromStorage();
    fillHeader(supplier);

    if (!supplier?.id) {
        alert('Fornecedor não encontrado. Volte e informe o CNPJ.');
        return;
    }

    let contracts = [];
    try {
        contracts = await getSupplierContracts(supplier.id);
    } catch (err) {
        console.error('Erro ao carregar contratos:', err);
        alert(err.message);
        return;
    }

    renderTable(contracts);
    document.addEventListener('change', handleSelectionChange);
    document.getElementById('btn-proxima').addEventListener('click', buildGoToNextStep(contracts));
}

init();
