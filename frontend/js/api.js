// Helper centralizado para chamadas HTTP, pra que mudanças globais
// (auth, base URL, retry) afetem só este arquivo, não cada página.

(function () {
  const base = () => window.APP_CONFIG.API_BASE_URL;

  // Faz a chamada HTTP padrão e desempacota o JSON; converte erros do
  // backend em Error com mensagem útil pra alert/showMessage.
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
      throw new Error('CNPJ não cadastrado no Sienge. Entre em contato com o suporte.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error || data.erro || `Erro HTTP ${response.status}`;
      throw new Error(message);
    }
    return data;
  }

  // Versão multipart/form-data; usada para upload de NF e boleto, já
  // que o navegador define o Content-Type com boundary correto.
  async function sendForm(path, formData) {
    const url = `${base()}${path}`;
    let response;
    try {
      response = await fetch(url, { method: 'POST', body: formData });
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
    postForm: (path, formData) => sendForm(path, formData),
  };
})();
