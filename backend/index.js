// Ponto de entrada do servidor.
// Padrão em camadas: routes -> controllers -> services.
// Variáveis sensíveis vêm de .env (via src/config/env.js).

const express = require('express');
const cors = require('cors');

const { env } = require('./src/config/env');
const fornecedorRoutes = require('./src/routes/fornecedorRoutes');

const app = express();

// --- CORS: apenas origens do .env podem acessar ---
const corsOptions = {
  origin: (origin, callback) => {
    // Requests sem origem (ex: curl, mesmo host) sempre passam.
    if (!origin) return callback(null, true);
    if (env.frontendOrigins.includes('*') || env.frontendOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Rotas ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'Online',
    timestamp: new Date().toISOString(),
    mensagem: 'Backend Porto Belo operando corretamente',
  });
});

app.use('/api', fornecedorRoutes);

// --- Handler global de erros (sempre por último) ---
app.use((err, _req, res, _next) => {
  console.error('[ERRO]', err.message);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

app.listen(env.port, () => {
  console.log('==========================================');
  console.log(`Servidor Porto Belo iniciado (${env.nodeEnv})`);
  console.log(`Endereço:  http://localhost:${env.port}`);
  console.log(`Sienge:    ${env.sienge.mock ? 'MOCK' : env.sienge.baseUrl}`);
  console.log(`CORS:      ${env.frontendOrigins.join(', ')}`);
  console.log('==========================================');
});
