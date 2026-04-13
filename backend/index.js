// Ponto de entrada do servidor.
// Padrão em camadas: routes -> controllers -> services.
// Variáveis sensíveis vêm de .env (via src/config/env.js).

const express = require('express');
const cors = require('cors');

const { env } = require('./src/config/env');
const supplierRoutes = require('./src/routes/supplierRoutes');


function getApplication() {
  let app = express();

  const corsOrigin = {
    origin: (origin, callback) => {
      // Requests sem origem (ex: curl, mesmo host)
      if (!origin) return callback(null, true);
      if (env.frontendOrigins.includes('*') || env.frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    }
  }

  app.use(cors(corsOrigin));
  app.use(express.json());
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'Online',
      timestamp: new Date().toISOString(),
      mensagem: 'Backend Porto Belo operando corretamente',
    });
  });

  app.use('/api', supplierRoutes);

  app.use((err, _req, res, _next) => {
    console.error('[ERRO]', err.message);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  });
  return app;
}

const app = getApplication();

app.listen(env.port, () => {
  console.log('==========================================');
  console.log(`Servidor Porto Belo iniciado (${env.nodeEnv})`);
  console.log(`Endereço:  http://localhost:${env.port}`);
  console.log(`Sienge:    ${env.sienge.mock ? 'MOCK' : env.sienge.baseUrl}`);
  console.log(`CORS:      ${env.frontendOrigins.join(', ')}`);
  console.log('==========================================');
});
