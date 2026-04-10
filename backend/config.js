async function fornecedorCadastrado(cnpj) {
  const response = await fetch(`${BASE_SIENGE_URL}/creditors?cnpj=${cnpj}`, {
    method: "GET",
    headers: { "Content-Type": "application/json",'Authorization': `Basic ${btoa(`${USERNAME_SIENGE}:${PASSWORD_SIENGE}`)}` },
    
  });
  const data =await response.json();
  console.log("Resposta do Sienge:", data);
  return data; // Retorna true se o fornecedor existir, false caso contrário

}

async function handleFornecedorRequest() {
  const cnpjInput = document.getElementById("cnpj");
  const cnpjDigitado = cnpjInput.value; // Exemplo de CNPJ


  if (!handleCnpjFormato(cnpjDigitado)) {
    return;
  }
  if (await !fornecedorCadastrado(cnpjDigitado)) {
    alert("Fornecedor não cadastrado, Por gentileza entrar em contato com o suporte.");
  }
  await enviarCnpj(cnpjDigitado);
} 

/* ============================
   Pagina inicial
   ============================ */
  function handleCnpjFormato(cnpj) {
    // Implementar a lógica de formatação do CNPJ
    // Remove tudo que não for número
    cnpj = cnpj.replace(/[^\d]+/g, '');

    // Deve ter 14 dígitos
    if (cnpj.length !== 14){
      alert("CNPJ deve conter 14 dígitos.");
      return false;
    };

    // Elimina CNPJs inválidos conhecidos (todos iguais)
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Validação do primeiro dígito verificador
    let tamanho = 12;
    let numeros = cnpj.substring(0, tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros[tamanho - i] * pos--;
        if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    if (resultado != cnpj[12]) return false;

    // Validação do segundo dígito verificador
    tamanho = 13;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros[tamanho - i] * pos--;
        if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    if (resultado != cnpj[13]) {
      alert("CNPJ inválido.");
      return false;
    };

    return true;
  }


async function enviarCnpj(cnpj) {
    
  

  try {
    const response = await fetch(`${LOCALHOST_API}/consultar-cnpj`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ cnpj: cnpj }),
});


    const data = await response.json();

    if (data.sucesso) {
      console.log("Fornecedor encontrado:", data.fornecedor);
      window.location.href = "./escolher-contrato.html";
    } else {
      alert("Erro: " + (data.erro || "CNPJ não encontrado"));
    }
  } catch (error) {
    console.error("Erro ao conectar no back:", error);
    alert("Erro ao conectar no servidor. O backend está ligado na porta 3001?");
  }
}

/* ============================
   Escolher contrato
   ============================ */
/*Removido os contratos de exemplos*/

const tbody = document.getElementById("tabela-contratos-body");
const btnProxima = document.getElementById("btn-proxima");

function renderTable() {
  tbody.innerHTML = "";
  payloadFornecedor.contratos.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="contrato-item" data-index="${index}"></td>
      <td class="text-start">${item.obra}</td>
      <td>${item.nome}</td>
      <td>${item.codigo}</td>
      <td class="bg-primary text-white">${item.retencao}</td>
    `;
    tbody.appendChild(tr);
  });
}
renderTable();

document.addEventListener("change", (e) => {
  if (e.target.classList.contains("contrato-item") || e.target.id === "master-checkbox") {
    if (e.target.id === "master-checkbox") {
      const checks = document.querySelectorAll(".contrato-item");
      checks.forEach((c) => (c.checked = e.target.checked));
    }
    const selecionados = document.querySelectorAll(".contrato-item:checked");
    if (selecionados.length > 0) {
      btnProxima.classList.add("btn-active");
      btnProxima.disabled = false;
    } else {
      btnProxima.classList.remove("btn-active");
      btnProxima.disabled = true;
    }
  }
});

btnProxima.addEventListener("click", () => {
  const checks = document.querySelectorAll(".contrato-item:checked");
  const contratosEscolhidos = [];
  checks.forEach((check) => {
    const idx = check.getAttribute("data-index");
    contratosEscolhidos.push(payloadFornecedor.contratos[idx]);
  });
  localStorage.setItem("contratosSelecionados", JSON.stringify(contratosEscolhidos));
  window.location.href = "dados-da-nota.html";
});

/* ============================
   Dados da nota'
   ============================ */
async function enviarDadosNota() {
  const numero = document.getElementById("numeroNota")?.value || "0";
  const valor = document.getElementById("valorNotaFiscal")?.value || "0,00";

  if (!numero || numero === "0") {
    alert("Por favor, preencha o número da nota.");
    return;
  }
            /*----------------Parte alterada------------------*/ 
  try {
    require('dotenv').config();

const response = await fetch(`${LOCALHOST_API}/salvar-nota`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ numeroNota: numero, valor: valor }),
});
/*----------------Parte alterada------------------*/ 
    const data = await response.json();

    if (data.sucesso) {
      console.log("Dados da nota salvos!");
      window.location.href = "./dados-do-pagamento.html";
    } else {
      alert("Erro ao salvar nota: " + (data.erro || "Erro desconhecido"));
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Certifique-se que o backend está rodando corretamente");
  }
}

/* ============================
   Dados do pagamento
   ============================ */
function prosseguirParaFinalizar() {
  const dadosPagamento = {
    banco: document.getElementById("bankCode")?.value || "",
    agencia: document.getElementById("agencia")?.value || "",
    conta: document.getElementById("conta")?.value || "",
    forma: document.getElementById("payment_method")?.value || "boleto",
    tipoConta: document.getElementById("typeAccount")?.value || "",
  };

  localStorage.setItem("dadosPagamento", JSON.stringify(dadosPagamento));
  window.location.href = "./finalizar-pagamento.html";
}

/* ============================
   Finalizar pagamento
   ============================ */
// Este trecho é apenas um JSON de configuração do Next.js exportado.
// Se não for usado diretamente no front, pode ser mantido como referência.
const nextData = {
  props: { pageProps: {} },
  page: "/access",
  query: {},
  buildId: "2oJLaxTbD3mN102hQiePt",
  nextExport: true,
  autoExport: true,
  isFallback: false,
  scriptLoader: [],}