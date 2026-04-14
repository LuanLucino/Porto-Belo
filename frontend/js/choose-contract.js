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
    document.getElementById('nome-fantasia-val').textContent = supplier.tradingName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
}

function renderTable(contracts) {
    const tbody = document.getElementById('tabela-contratos-body');
    tbody.innerHTML = '';
    contracts.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="contrato-item" data-index="${index}"></td>
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
    if (!event.target.classList.contains('contrato-item') && event.target.id !== 'master-checkbox') {
        return;
    }

    if (event.target.id === 'master-checkbox') {
        document.querySelectorAll('.contrato-item').forEach((c) => { c.checked = event.target.checked; });
    }

    updateNextButton();
}

function buildGoToNextStep(contracts) {
    return function goToNextStep() {
        const selectedContracts = [];
        document.querySelectorAll('.contrato-item:checked').forEach((check) => {
            const idx = check.getAttribute('data-index');
            selectedContracts.push(contracts[idx]);
        });

        localStorage.setItem('selectedContracts', JSON.stringify(selectedContracts));
        window.location.href = 'invoice-data.html';
    };
}

async function init() {
    fillHeader(getSupplierFromStorage());

    let contracts = [];
    try {
        const data = await window.api.get('/get-contracts');
        contracts = data.supplierContracts ?? [];
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
