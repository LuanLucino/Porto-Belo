const express = require('express');
const router = express.Router();
const fornecedorController = require('../controllers/fornecedorController');

// Rota da Página 1
router.post('/consultar-cnpj', fornecedorController.verificarCnpj);

// Rota da Página 2
router.post('/salvar-nota', fornecedorController.salvarDadosNota);

// Rota da Página 3 (Final)
router.post('/finalizar-pagamento', fornecedorController.finalizarPagamento);

module.exports = router;