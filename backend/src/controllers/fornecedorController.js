// Simulando um banco de dados temporário (em memória)
let dadosTemporarios = {};

exports.verificarCnpj = async (req, res) => {
    const { cnpj } = req.body;
    console.log(`[Etapa 1] Validando CNPJ: ${cnpj}`);
    
    if (!cnpj || cnpj.length < 14) {
        return res.status(400).json({ erro: "CNPJ inválido ou incompleto." });
    }

    // Simulando que achamos o fornecedor
    dadosTemporarios.fornecedor = { cnpj, nome: "Fornecedor Teste LTDA" };
    
    res.json({ sucesso: true, mensagem: "CNPJ verificado!", fornecedor: dadosTemporarios.fornecedor });
};

exports.salvarDadosNota = async (req, res) => {
    const { numeroNota, valor, dataEmissao } = req.body;
    console.log(`[Etapa 2] Dados da Nota:`, req.body);

    if (!numeroNota || !valor) {
        return res.status(400).json({ erro: "Dados da nota incompletos." });
    }

    dadosTemporarios.nota = { numeroNota, valor, dataEmissao };
    res.json({ sucesso: true, mensagem: "Dados da nota salvos temporariamente!" });
};

exports.finalizarPagamento = async (req, res) => {
    const { formaPagamento } = req.body;
    console.log(`[Etapa 3] Finalizando:`, formaPagamento);

    if (!formaPagamento) {
        return res.status(400).json({ erro: "Selecione uma forma de pagamento." });
    }

    // Aqui seria onde enviaríamos para o Sienge
    const payloadFinal = { ...dadosTemporarios, formaPagamento };
    console.log("=== ENVIANDO PARA O SIENGE (SIMULADO) ===");
    console.log(payloadFinal);

    res.json({ 
        sucesso: true, 
        mensagem: "Processo finalizado com sucesso! Título criado no financeiro.",
        protocolo: Math.floor(Math.random() * 100000)
    });
};