const express = require('express');
const multer = require('multer');
const router = express.Router();
const measurementController = require('../controllers/measurementControllers');

// Upload fica em memória (buffer). Limite alinhado com o do Sienge (70MB).
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 70 * 1024 * 1024 },
});

router.post('/create-measurement', measurementController._createMeasurement);
router.post('/send-measurement-attachment', upload.single('file'), measurementController._sendMeasurementAttachment);

module.exports = router;
