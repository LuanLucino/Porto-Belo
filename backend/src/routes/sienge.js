const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierControllers');

router.get("/get-supplier", supplierController._getSupplier);
router.get("/get-contracts", supplierController._getContracts);
router.get("/get-supplier-bank-info", supplierController._getSupplierBankInfo);
router.get("/get-contract-buildings", supplierController._getContractBuildings);
router.get("/get-contract-items", supplierController._getContractItems);
router.get("/is-supplier-registered", supplierController._isSupplierRegistered);

module.exports = router;
