// Invoice controller: validates the payload and delegates persistence to the service.

const { siengeGateway } = require('../services/siengeService');

exports._saveInvoice = async (req, res, next) => {
  try {
    const { invoiceNumber, invoiceValue, emissionDate } = req.body ?? {};

    if (!invoiceNumber) {
      return res.status(400).json({ error: 'invoiceNumber é obrigatório.' });
    }
    if (!invoiceValue) {
      return res.status(400).json({ error: 'invoiceValue é obrigatório.' });
    }

    const result = await siengeGateway.saveInvoice({ invoiceNumber, invoiceValue, emissionDate });
    return res.status(201).json({ invoice: result });
  } catch (err) {
    return next(err);
  }
};
