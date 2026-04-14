const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceControllers');

router.post('/save-invoice', invoiceController._saveInvoice);

module.exports = router;
