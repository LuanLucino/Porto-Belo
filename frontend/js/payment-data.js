let selectedBoletoFile = null;

// Preenche o cabeçalho com dados do fornecedor pra manter o contexto
// visual entre as telas do fluxo.
function fillHeader() {
    const supplier = getLocalStorage('supplier');
    if (!supplier) return;
    document.getElementById('razao-social-val').textContent = supplier.name ?? '';
    document.getElementById('nome-fantasia-val').textContent = supplier.tradeName ?? '';
    document.getElementById('cnpj-val').textContent = supplier.cnpj ?? '';
}

// Decide entre PF/PJ pelo número de dígitos do documento; o
// personType do Sienge nem sempre vem com nomes consistentes.
function detectTypePerson(document) {
    const digits = String(document ?? '').replace(/\D/g, '');
    if (digits.length === 14) return 'cnpj';
    if (digits.length === 11) return 'cpf';
    return '';
}

// Pré-preenche o favorecido com o próprio fornecedor; é o caso mais
// comum (paga pra si mesmo) e poupa retrabalho do usuário.
function prefillFromSupplier() {
    const supplier = getLocalStorage('supplier');
    if (!supplier) return;
    const cpfCnpjEl = document.getElementById('cpfCnpjFavorecido');
    if (cpfCnpjEl && !cpfCnpjEl.value && supplier.cnpj) {
        cpfCnpjEl.value = supplier.cnpj;
    }
    const typePersonEl = document.getElementById('typePerson');
    if (typePersonEl && !typePersonEl.value) {
        typePersonEl.value = detectTypePerson(supplier.cnpj);
    }
    const nomeFavorecidoEl = document.getElementById('nomeFavorecido');
    if (nomeFavorecidoEl && !nomeFavorecidoEl.value && supplier.name) {
        nomeFavorecidoEl.value = supplier.name;
    }
}

// Atualiza o campo só se ainda estiver vazio; usado em sugestões pra
// não sobrescrever algo que o usuário já digitou.
function setIfEmpty(id, value) {
    const el = document.getElementById(id);
    if (!el || value == null || value === '') return;
    if (!el.value) el.value = value;
}

// Sobrescreve o valor do campo independente do conteúdo atual; usado
// quando o usuário escolhe explicitamente uma conta no dropdown.
function forceSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value ?? '';
}

// Traduz o código de tipo de conta do Sienge ('C', 'P', 'CC', etc.)
// pro valor do select que casa com o submit da medição.
function mapAccountType(raw) {
    const v = String(raw ?? '').toUpperCase();
    if (v === 'C' || v.startsWith('CC') || v.includes('CORRENTE') || v.includes('CHECKING')) return 'Conta Corrente';
    if (v === 'P' || v.startsWith('CP') || v.includes('POUPAN') || v.includes('SAVINGS')) return 'Conta Poupança';
    return '';
}

// Monta o rótulo amigável do banco ("104 - Caixa Econômica") pra
// exibição no input bankCode e no select de contas cadastradas.
function bankDisplay(bank) {
    if (!bank.bankCode) return '';
    return bank.bankName ? `${bank.bankCode} - ${bank.bankName}` : bank.bankCode;
}

// Aplica a conta selecionada do Sienge nos campos manuais; o usuário
// ainda pode editar depois caso queira ajustar algo pontual.
function applyBankAccount(bank) {
    forceSet('bankCode', bankDisplay(bank));
    forceSet('agencia', bank.agency);
    forceSet('conta', bank.accountNumber);
    forceSet('typeAccount', mapAccountType(bank.accountType));
    forceSet('nomeFavorecido', bank.holderName);
    forceSet('cpfCnpjFavorecido', bank.holderDocument);
    forceSet('typePerson', detectTypePerson(bank.holderDocument));
}

// Renderiza o dropdown de contas cadastradas no Sienge; o select fica
// oculto se o fornecedor não tiver contas (preenchimento 100% manual).
function renderBankPicker() {
    const wrapper = document.getElementById('bankAccountPickerWrapper');
    const select = document.getElementById('bankAccountPicker');
    if (!wrapper || !select) return;

    const banks = getLocalStorage('supplierBankInfo') ?? [];
    if (!banks.length) {
        wrapper.style.display = 'none';
        return;
    }

    select.innerHTML = '<option value="">— Selecione uma conta cadastrada ou preencha manualmente abaixo —</option>';
    banks.forEach((bank, idx) => {
        const label = [
            bankDisplay(bank),
            bank.agency ? `Ag ${bank.agency}` : null,
            bank.accountNumber ? `Cc ${bank.accountNumber}` : null,
            bank.holderName,
            bank.isDefault ? '★ padrão' : null,
        ].filter(Boolean).join(' • ');
        const option = document.createElement('option');
        option.value = String(idx);
        option.textContent = label;
        select.appendChild(option);
    });

    const defaultIdx = banks.findIndex(b => b.isDefault);
    if (defaultIdx >= 0) {
        select.value = String(defaultIdx);
        applyBankAccount(banks[defaultIdx]);
    }

    select.addEventListener('change', () => {
        const idx = Number(select.value);
        if (Number.isInteger(idx) && banks[idx]) {
            applyBankAccount(banks[idx]);
        }
    });

    wrapper.style.display = '';
}

// Captura o PDF do boleto; mantém em memória até o avanço pra ser
// serializado em base64 no localStorage.
function setupBoletoFileInput() {
    const input = document.getElementById('boletoFile');
    const label = document.getElementById('boletoFileName');
    if (!input) return;
    input.addEventListener('change', (e) => {
        selectedBoletoFile = e.target.files[0] || null;
        if (label) label.textContent = selectedBoletoFile ? selectedBoletoFile.name : '';
    });
}

// Converte um File pra data URL (base64) pra que ele sobreviva à
// navegação entre páginas via localStorage.
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// Persiste o boleto no localStorage só se o usuário anexou; senão
// limpa qualquer resíduo de um envio anterior.
async function persistBoletoIfPresent() {
    if (!selectedBoletoFile) {
        localStorage.removeItem('boletoFile');
        return;
    }
    try {
        const dataUrl = await fileToBase64(selectedBoletoFile);
        setLocalStorage('boletoFile', {
            name: selectedBoletoFile.name,
            type: selectedBoletoFile.type,
            dataUrl,
        });
    } catch (err) {
        console.error('Falha ao ler o boleto:', err);
    }
}

// Coleta todos os campos de pagamento, persiste o boleto se tiver, e
// segue pro finalize que vai consolidar tudo e enviar pro Sienge.
async function prosseguirParaFinalizar() {
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
    await persistBoletoIfPresent();
    window.location.href = './finalize-payment.html';
}

// Mostra só a seção do método de pagamento escolhido; cada forma tem
// campos próprios (boleto, transfer, parcelado) e não devem se misturar.
function togglePaymentSection(value) {
    const sections = ['section-ticket', 'section-transfer', 'section-installments'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const target = document.getElementById(`section-${value}`);
    if (target) target.style.display = '';
}

fillHeader();
prefillFromSupplier();
renderBankPicker();
setupBoletoFileInput();

document.getElementById('payment_method')?.addEventListener('change', (e) => {
    togglePaymentSection(e.target.value);
});
