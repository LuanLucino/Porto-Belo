// Measurement controller: valida os identificadores do contrato e o payload,
// e delega a criação da medição ao gateway do Sienge.

const { siengeGateway } = require('../services/siengeService');

exports._createMeasurement = async (req, res, next) => {
  try {
    const { documentId, contractNumber, buildingId } = req.query;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId é obrigatório.' });
    }
    if (!contractNumber) {
      return res.status(400).json({ error: 'contractNumber é obrigatório.' });
    }
    if (!buildingId) {
      return res.status(400).json({ error: 'buildingId é obrigatório.' });
    }

    const body = req.body ?? {};
    if (!body.measurementDate) {
      return res.status(400).json({ error: 'measurementDate é obrigatório.' });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'items é obrigatório e deve conter ao menos um item.' });
    }

    const measurement = await siengeGateway.createMeasurement(
      documentId,
      contractNumber,
      buildingId,
      body,
    );
    return res.status(201).json({ measurement });
  } catch (err) {
    return next(err);
  }
};
