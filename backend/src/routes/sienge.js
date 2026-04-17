const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierControllers');

// Route to get the supplier data
router.get("/get-supplier", supplierController._getSupplier);

// Route to get the contracts
router.get("/get-contracts", supplierController._getContracts);

// Route to get the buildings (with building units) of a selected contract
router.get("/get-contract-buildings", supplierController._getContractBuildings);

// Route to get the items of a selected contract
router.get("/get-contract-items", supplierController._getContractItems);

// Route to check if the supplier is registered
router.get("/is-supplier-registered", supplierController._isSupplierRegistered);

module.exports = router;