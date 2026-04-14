function prosseguirParaFinalizar() {
    // 1. Captura usando os IDs REAIS do seu HTML
    const dadosPagamento = {
        banco: document.getElementById('bankCode')?.value || '',
        agencia: document.getElementById('agencia')?.value || '',
        conta: document.getElementById('conta')?.value || '',
        // O campo 'payment_method' é o select lá de cima
        forma: document.getElementById('payment_method')?.value || 'boleto',
        tipoConta: document.getElementById('typeAccount')?.value || ''
    };

    // 2. Salva no localStorage
    localStorage.setItem('dadosPagamento', JSON.stringify(dadosPagamento));

    // 3. Redireciona
    window.location.href = "./finalizar-pagamento.html";
}