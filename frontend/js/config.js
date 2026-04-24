// Config único do frontend.
// O API_BASE_URL é derivado do host pelo qual a página foi servida — assim o
// portal funciona vindo de localhost (dev), do IP da LAN (rede da empresa) ou
// de um domínio público, sem precisar rebuildar a imagem do nginx.
// Qualquer script de página deve usar window.APP_CONFIG.API_BASE_URL.

const BACKEND_PORT = 3001;

function buildApiBaseUrl() {
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${BACKEND_PORT}/api`;
}

window.APP_CONFIG = Object.freeze({
  API_BASE_URL: buildApiBaseUrl(),
});
