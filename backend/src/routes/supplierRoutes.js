const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierControllers');

// Route to get the supplier data
router.get("/get-supplier", supplierController._getSupplier);

// Route to get the contracts
router.get("/get-contracts", supplierController._getContracts);


module.exports = router;