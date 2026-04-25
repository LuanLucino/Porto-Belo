const { siengeGateway } = require('../services/siengeService');

// Cria a medição no Sienge a partir do que foi coletado pelo fluxo
// (contrato, item, NF). Valida os obrigatórios antes de chamar a API.
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

// Anexa um arquivo (NF ou boleto) à medição já criada; cada chamada
// envia um anexo só, então o frontend chama uma vez por arquivo.
exports._sendMeasurementAttachment = async (req, res, next) => {
  try {
    const { documentId, contractNumber, buildingId, measurementNumber, description } = req.body ?? {};

    if (!documentId) return res.status(400).json({ error: 'documentId é obrigatório.' });
    if (!contractNumber) return res.status(400).json({ error: 'contractNumber é obrigatório.' });
    if (!buildingId) return res.status(400).json({ error: 'buildingId é obrigatório.' });
    if (!measurementNumber) return res.status(400).json({ error: 'measurementNumber é obrigatório.' });
    if (!description) return res.status(400).json({ error: 'description é obrigatório.' });
    if (!req.file) return res.status(400).json({ error: 'file é obrigatório.' });

    const attachment = await siengeGateway.sendMeasurementAttachment({
      documentId,
      contractNumber,
      buildingId,
      measurementNumber,
      description,
      file: req.file,
    });
    return res.status(201).json({ attachment });
  } catch (err) {
    return next(err);
  }
};
