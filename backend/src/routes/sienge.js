const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierControllers');

// Route to get the supplier data
router.get("/get-supplier", supplierController._getSupplier);

// Route to get the contracts
router.get("/get-contracts", supplierController._getContractsByCompanyId);

// Route to check if the supplier is registered
router.get("/is-supplier-registered", supplierController._isSupplierRegistered);

router.get("/get-companies", supplierController._getCompanies);

router.get("/get-contracts-by-company-id", supplierController.filterSupplierContractsById);

module.exports = router;