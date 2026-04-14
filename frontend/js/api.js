// Helper centralizado de chamadas HTTP.
// Motivo: nenhuma página deve montar fetch() na mão.
// Assim, se a API mudar (headers de auth, base URL, retry), altera-se um arquivo só.

(function () {
  const base = () => window.APP_CONFIG.API_BASE_URL;

  async function request(method, path, body) {
    const url = `${base()}${path}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(url, options);
    } catch (networkErr) {
      throw new Error('Não foi possível conectar ao servidor. O backend está rodando?');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error || data.erro || `Erro HTTP ${response.status}`;
      throw new Error(message);
    }
    return data;
  }

  window.api = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
  };
})();
