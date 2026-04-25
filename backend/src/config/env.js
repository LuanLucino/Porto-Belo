// Centraliza a leitura do .env num só lugar para o resto do código
// só consumir o objeto `env` já tipado, sem chamar process.env espalhado.

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Lê uma variável obrigatória; se faltar, derruba o boot na hora
// para o erro aparecer cedo, e não em runtime no meio de uma request.
function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

// Lê uma variável opcional com fallback; usado para configs que têm
// um default razoável em dev (porta, nodeEnv, etc.).
function optional(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

// Quebra valores tipo "a,b,c" em array; útil para FRONTEND_ORIGINS
// que aceita múltiplas URLs separadas por vírgula.
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
