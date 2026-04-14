// Ponto único de leitura do .env.
// Qualquer variável de ambiente deve ser lida AQUI e exportada tipada.
// No resto do código use: const { env } = require('./config/env');

const path = require('path');

// Aponta o dotenv pro .env do backend, independente de onde o node foi invocado.
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

function optional(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function parseList(value) {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

const env = {
  port: Number(optional('PORT', '3001')),
  nodeEnv: optional('NODE_ENV', 'development'),
  frontendOrigins: parseList(optional('FRONTEND_ORIGINS', '*')),

  sienge: {
    baseUrl: optional('SIENGE_BASE_URL', ''),
    user: optional('SIENGE_USER', ''),
    password: optional('SIENGE_PASSWORD', ''),
    timeoutMs: Number(optional('SIENGE_TIMEOUT_MS', '10000')),
    mock: optional('SIENGE_MOCK', 'true').toLowerCase() === 'true',
  },
};

module.exports = { env, required, optional };
