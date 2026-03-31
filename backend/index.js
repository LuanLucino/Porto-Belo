// Carrega as variáveis do arquivo .env (TOKEN, PORTA, etc)
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Importa as rotas que vamos criar (fornecedor, notas, etc)
const fornecedorRoutes = require('./src/routes/fornecedorRoutes');

const app = express();

// --- MIDDLEWARES ---

// Permite que o teu HTML (localhost) aceda a este servidor
app.use(cors());

// Faz o Express conseguir ler o corpo das requisições em JSON
app.use(express.json());

// --- ROTAS ---

// Rota de teste para verificar se o servidor está online
app.get('/api/health', (req, res) => {
    res.json({ 
        status: "Online", 
        timestamp: new Date().toISOString(),
        mensagem: "Backend Porto Belo operando corretamente" 
    });
});

// Agrupa todas as rotas de fornecedores sob o prefixo /api
// Exemplo: POST http://localhost:3001/api/consultar-cnpj
app.use('/api', fornecedorRoutes);

// --- INICIALIZAÇÃO ---

// Tenta usar a porta do .env ou a 3001 por padrão
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log('==========================================');
    console.log(`🚀 Servidor Porto Belo iniciado com sucesso!`);
    console.log(`📍 Endereço: http://localhost:${PORT}`);
    console.log(`🛠️  Pressione CTRL+C para parar`);
    console.log('==========================================');
});