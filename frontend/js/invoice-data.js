// Mostra um toast temporário no canto da tela; usado para validação
// de formulário e erros não-fatais que o alert() poluiria.
function showMessage(message, type = 'error', duration = 4000) {
    const box = document.getElementById('message-box');
    box.textContent = message;
    box.className = `message-box ${type}`;
    box.style.display = 'block';
    setTimeout(() => {
        box.style.display = 'none';
    }, duration);
}

let selectedFile = null;

// Converte um File pra data URL (base64) pra que o arquivo sobreviva
// à navegação entre páginas via localStorage.
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
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

// Mostra o código do contrato escolhido pra confirmar visualmente o
// alvo da NF antes do usuário preencher os campos.
function fillContractInfo() {
    const contract = getLocalStorage('selectedContract');
    if (!contract) {
        showMessage('Nenhum contrato selecionado. Volte e selecione um contrato.', 'error');
        return;
    }
    document.getElementById('codigo-contrato-val').textContent = contract.code ?? '';
}

// Captura o PDF da NF; o arquivo fica em memória até o usuário
// avançar, quando é serializado para localStorage.
function setupFileInput() {
    document.getElementById('invoiceFile').addEventListener('change', (e) => {
        selectedFile = e.target.files[0] || null;
        document.getElementById('fileName').textContent = selectedFile ? selectedFile.name : '';
    });
}

// Aplica máscara BRL no campo Valor enquanto o usuário digita, pra
// evitar ambiguidade entre vírgula/ponto na hora do parse.
const valorInput = document.getElementById("valorNotaFiscal");

valorInput.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value) {
    let formatted = (Number(value) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    e.target.value = formatted;
  } else {
    e.target.value = "";
  }
});

// Valida o formulário, persiste os dados da NF (incluindo o PDF) em
// localStorage e avança pra coleta dos dados de pagamento.
async function sendInvoiceData() {
    const invoiceNumber = document.getElementById('numeroNota')?.value || '';
    const invoiceValueFormatted = document.getElementById('valorNotaFiscal')?.value || '';
    const emissionDate = document.getElementById('dataEmissao')?.value || '';
    const dueDate = document.getElementById('dataVencimento')?.value || '';

    if (!invoiceNumber) {
        showMessage('Por favor, preencha o número da nota.', 'error');
        return;
    }
    if (!emissionDate) {
        showMessage('Por favor, preencha a data de emissão.', 'error');
        return;
    }
    if (!dueDate) {
        showMessage('Por favor, preencha a data de vencimento.', 'error');
        return;
    }
    if (!invoiceValueFormatted) {
        showMessage('Por favor, preencha o valor da nota.', 'error');
        return;
    }

    const invoiceValue = parseFloat(invoiceValueFormatted.replace(/[^\d]/g, "")) / 100;

    if (!selectedFile) {
        showMessage('Por favor, anexe a nota fiscal.', 'error');
        return;
    }

    setLocalStorage('invoiceData', {
        invoiceNumber,
        invoiceValue,
        emissionDate,
        dueDate,
        hasFile: !!selectedFile,
    });

    if (selectedFile) {
        try {
            const dataUrl = await fileToBase64(selectedFile);
            setLocalStorage('invoiceFile', {
                name: selectedFile.name,
                type: selectedFile.type,
                dataUrl,
            });
        } catch (err) {
            console.error('Falha ao ler o arquivo da NF:', err);
            showMessage('Não foi possível ler o arquivo anexado. Tente novamente.', 'error');
            return;
        }
    } else {
        localStorage.removeItem('invoiceFile');
    }

    window.location.href = './payment-data.html';
}

fillHeader();
fillContractInfo();
setupFileInput();
