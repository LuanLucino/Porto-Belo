// Config único do frontend.
// Para mudar a URL do backend (dev/prod), edite SÓ este arquivo.
// Qualquer script de página deve usar window.APP_CONFIG.API_BASE_URL.

window.APP_CONFIG = Object.freeze({
  API_BASE_URL: 'http://localhost:3001/api',
});
