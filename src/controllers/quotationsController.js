'use strict';

const { generateQuotationTag } = require('../services/financialYearService');
const { generateQuotationPDF, deleteAllGeneratedPdfs } = require('../services/pdfGenerator');
const prisma = require('../lib/prisma');

// ─── Helpers ────────────────────────────────────────────────────────────────

const QUOTATION_INCLUDE = {
  financial_year: true,
  cable_items: { orderBy: { sno: 'asc' } },
};

function validateCreateBody(body) {
  const errors = [];
  if (!body.client_name?.trim())    errors.push('client_name is required');
  if (!body.client_unit?.trim())    errors.push('client_unit is required');
  if (!body.client_address?.trim()) errors.push('client_address is required');
  if (!body.enquiry_no?.trim())     errors.push('enquiry_no is required');

  if (!Array.isArray(body.cable_items) || body.cable_items.length === 0) {
    errors.push('cable_items must be a non-empty array');
  } else {
    body.cable_items.forEach((item, i) => {
      if (!item.description?.trim())
        errors.push(`cable_items[${i}].description is required`);
      if (!Number.isInteger(item.quantity_meters) || item.quantity_meters <= 0)
        errors.push(`cable_items[${i}].quantity_meters must be a positive integer`);
      if (isNaN(parseFloat(item.rate_per_meter)) || parseFloat(item.rate_per_meter) < 0)
        errors.push(`cable_items[${i}].rate_per_meter must be a non-negative number`);
    });
  }
  return errors;
}

// ─── POST /quotations ───────────────────────────────────────────────────────

async function createQuotation(req, res) {
  try {
    const errors = validateCreateBody(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }

    const {
      client_name,
      client_unit,
      client_address,
      enquiry_no,
      date,
      cable_items,
    } = req.body;

    const parsedDate = date ? new Date(date) : new Date();
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const quotation = await prisma.$transaction(async (tx) => {
      // Atomically get a unique tag + serial number
      const { tag, serialNumber, fyId } = await generateQuotationTag();

      const created = await tx.quotation.create({
        data: {
          tag,
          fy_id:         fyId,
          serial_number: serialNumber,
          client_name:   client_name.trim(),
          client_unit:   client_unit.trim(),
          client_address: client_address.trim(),
          enquiry_no:    enquiry_no.trim(),
          date:          parsedDate,
          cable_items: {
            create: cable_items.map((item, index) => ({
              sno:             index + 1,
              description:     item.description.trim(),
              quantity_meters: item.quantity_meters,
              rate_per_meter:  parseFloat(item.rate_per_meter),
            })),
          },
        },
        include: QUOTATION_INCLUDE,
      });

      return created;
    });

    return res.status(201).json({ success: true, data: quotation });
  } catch (err) {
    console.error('[createQuotation]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /quotations ────────────────────────────────────────────────────────

async function listQuotations(req, res) {
  try {
    const { fy_label, date_from, date_to, client_name } = req.query;

    const where = {};

    // Filter by financial year label e.g. ?fy_label=25-26
    if (fy_label) {
      where.financial_year = { label: fy_label.trim() };
    }

    // Filter by date range e.g. ?date_from=2025-04-01&date_to=2026-03-31
    if (date_from || date_to) {
      where.date = {};
      if (date_from) {
        const fromDate = new Date(date_from);
        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid date_from' });
        }
        where.date.gte = fromDate;
      }
      if (date_to) {
        const toDate = new Date(date_to);
        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid date_to' });
        }
        where.date.lte = toDate;
      }
    }

    // Filter by client name (case-insensitive partial match)
    if (client_name) {
      where.client_name = { contains: client_name.trim(), mode: 'insensitive' };
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include:  QUOTATION_INCLUDE,
      orderBy:  { created_at: 'desc' },
    });

    return res.json({ success: true, count: quotations.length, data: quotations });
  } catch (err) {
    console.error('[listQuotations]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── GET /quotations/:id ────────────────────────────────────────────────────

async function getQuotation(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const quotation = await prisma.quotation.findUnique({
      where:   { id },
      include: QUOTATION_INCLUDE,
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    return res.json({ success: true, data: quotation });
  } catch (err) {
    console.error('[getQuotation]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── PUT /quotations/:id ────────────────────────────────────────────────────

async function updateQuotation(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const {
      client_name,
      client_unit,
      client_address,
      enquiry_no,
      cable_items,
    } = req.body || {};

    if (!client_name?.trim()) {
      return res.status(400).json({ success: false, message: 'client_name is required' });
    }
    if (!client_unit?.trim()) {
      return res.status(400).json({ success: false, message: 'client_unit is required' });
    }
    if (!client_address?.trim()) {
      return res.status(400).json({ success: false, message: 'client_address is required' });
    }
    if (!enquiry_no?.trim()) {
      return res.status(400).json({ success: false, message: 'enquiry_no is required' });
    }
    if (!Array.isArray(cable_items) || cable_items.length === 0) {
      return res.status(400).json({ success: false, message: 'cable_items must be a non-empty array' });
    }

    const parsedItems = cable_items.map((item, index) => {
      const sno = index + 1;
      const description = item?.description?.trim();
      const quantity = parseInt(String(item?.quantity_meters).trim(), 10);
      const rate = parseFloat(String(item?.rate_per_meter).trim());

      if (!description) {
        throw new Error(`cable_items[${index}].description is required`);
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`cable_items[${index}].quantity_meters must be a positive integer`);
      }
      if (!Number.isFinite(rate) || rate < 0) {
        throw new Error(`cable_items[${index}].rate_per_meter must be a non-negative number`);
      }

      return {
        sno,
        description,
        quantity_meters: quantity,
        rate_per_meter: rate,
      };
    });

    const updated = await prisma.$transaction(async (tx) => {
      // Keep same quotation tag/fy/serial; update only client fields + cable items.
      await tx.cableItem.deleteMany({ where: { quotation_id: id } });

      const res = await tx.quotation.update({
        where: { id },
        data: {
          client_name: client_name.trim(),
          client_unit: client_unit.trim(),
          client_address: client_address.trim(),
          enquiry_no: enquiry_no.trim(),
          cable_items: {
            create: parsedItems.map((item) => ({
              sno: item.sno,
              description: item.description,
              quantity_meters: item.quantity_meters,
              rate_per_meter: item.rate_per_meter,
            })),
          },
        },
        include: QUOTATION_INCLUDE,
      });

      return res;
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    // Surface validation errors as 400 where possible.
    const msg = err?.message || 'Internal server error';
    const status = msg.startsWith('cable_items[') ? 400 : 500;
    console.error('[updateQuotation]', err);
    return res.status(status).json({ success: false, message: msg });
  }
}

// ─── GET /quotations/:id/pdf ────────────────────────────────────────────────

async function getQuotationPdf(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: QUOTATION_INCLUDE,
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const unitId = (quotation.client_unit || 'UNKNOWN').replace(/[^a-zA-Z0-9_-]/g, '_');
    let termsFromRequest = null;
    if (req.query?.terms) {
      try {
        const termsB64 = String(req.query.terms);
        const decoded = Buffer.from(termsB64, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object') termsFromRequest = parsed;
      } catch (e) {
        // Ignore invalid terms payload; fallback to defaults in pdfGenerator.js
      }
    }

    const quotationWithTerms = termsFromRequest ? { ...quotation, terms: termsFromRequest } : quotation;
    const { buffer, filename } = await generateQuotationPDF(quotationWithTerms, unitId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    console.error('[getQuotationPdf]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── DELETE /quotations/reset ───────────────────────────────────────────────

async function resetQuotations(req, res) {
  try {
    // Wrap in a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Delete all cable items first (avoid FK constraint issues)
      await tx.cableItem.deleteMany({});
      
      // 2. Delete all quotations
      await tx.quotation.deleteMany({});
      
      // 3. Reset the financial year counter to 0 for all active frames
      await tx.financialYear.updateMany({
        data: { counter: 0 }
      });
    });

    // Delete all generated PDF files from disk
    deleteAllGeneratedPdfs();

    return res.json({ success: true, message: 'Reset complete' });
  } catch (err) {
    console.error('[resetQuotations]', err);
    return res.status(500).json({ success: false, message: 'Internal server error while resetting database' });
  }
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  createQuotation,
  listQuotations,
  getQuotation,
  updateQuotation,
  getQuotationPdf,
  resetQuotations,
};
