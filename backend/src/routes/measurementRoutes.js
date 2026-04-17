const express = require('express');
const router = express.Router();
const measurementController = require('../controllers/measurementControllers');

router.post('/create-measurement', measurementController._createMeasurement);

module.exports = router;
