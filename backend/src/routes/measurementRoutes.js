const express = require('express');
const multer = require('multer');
const router = express.Router();
const measurementController = require('../controllers/measurementControllers');

// Multer em memória pra evitar I/O em disco; o limite acompanha o
// máximo aceito pelo Sienge (70MB por arquivo).
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 70 * 1024 * 1024 },
});

router.post('/create-measurement', measurementController._createMeasurement);
router.post('/send-measurement-attachment', upload.single('file'), measurementController._sendMeasurementAttachment);

module.exports = router;
