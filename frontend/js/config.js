// Config único do frontend. Todas as páginas leem daqui via
// window.APP_CONFIG.API_BASE_URL pra evitar URLs hardcoded espalhadas.

const BACKEND_PORT = 3001;

// Deriva a URL do backend do mesmo host que serviu a página, pra que
// localhost, IP da LAN ou domínio público funcionem sem rebuild.
function buildApiBaseUrl() {
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${BACKEND_PORT}/api`;
}

window.APP_CONFIG = Object.freeze({
  API_BASE_URL: buildApiBaseUrl(),
});
