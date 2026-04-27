'use strict';

const { Router } = require('express');
const {
  createQuotation,
  listQuotations,
  getQuotation,
  updateQuotation,
  getQuotationPdf,
  resetQuotations,
} = require('../controllers/quotationsController');

const router = Router();

router.post('/',    createQuotation);
router.get('/',     listQuotations);
router.put('/:id', updateQuotation);
router.delete('/reset', resetQuotations);
router.get('/:id/pdf', getQuotationPdf);
router.get('/:id',  getQuotation);

module.exports = router;
