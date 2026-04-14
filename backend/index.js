const express = require('express');
const cors = require('cors');

const { env } = require('./src/config/env');
const supplierRoutes = require('./src/routes/sienge');
const invoiceRoutes = require('./src/routes/invoiceRoutes');


function getCorsOptions() {
  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        env.frontendOrigins.includes('*') ||
        env.frontendOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
  };
}

function registerApplicationHealth(app) {
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'Online',
      timestamp: new Date().toISOString(),
      mensagem: 'Backend Porto Belo operando corretamente',
    });
  });
}

function errorHandler() {
  return (err, _req, res, _next) => {
    const status = err.statusCode ?? 500;
    console.error(`[ERRO ${status}]`, err.message);
    res.status(status).json({ error: err.message || 'Erro interno no servidor.' });
  };
}

function getApplication() {
  const app = express();
  const corsOptions = getCorsOptions();
  const errorHandlerMiddleware = errorHandler();

  app.use(cors(corsOptions));
  app.use(express.json());

  registerApplicationHealth(app);
  app.use('/api', supplierRoutes);
  app.use('/api', invoiceRoutes);

  app.use(errorHandlerMiddleware);

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