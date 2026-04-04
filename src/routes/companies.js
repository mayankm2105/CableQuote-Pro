'use strict';

const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// GET /api/companies
router.get('/', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { id: 'asc' },
    });
    return res.json({ success: true, data: companies });
  } catch (err) {
    console.error('[GET /api/companies]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/companies/:unitId  — lookup by unit_id string, not numeric id
router.get('/:unitId', async (req, res) => {
  try {
    const unitId = req.params.unitId.trim();
    if (!unitId) {
      return res.status(400).json({ success: false, message: 'Unit ID is required' });
    }

    const company = await prisma.company.findFirst({
      where: { unit_id: unitId },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.json({ success: true, data: company });
  } catch (err) {
    console.error(`[GET /api/companies/${req.params.unitId}]`, err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/companies
router.post('/', async (req, res) => {
  try {
    const { unit_id, name, address } = req.body;

    if (!unit_id?.trim()) {
      return res.status(400).json({ success: false, message: 'Unit ID is required' });
    }
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const company = await prisma.company.create({
      data: {
        unit_id: unit_id.trim().toUpperCase(),
        name: name.trim(),
        address: address?.trim() || null,
      },
    });

    return res.status(201).json({ success: true, data: company });
  } catch (err) {
    console.error('[POST /api/companies]', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A company with this Unit ID already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/companies/:id  — still deletes by numeric id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    await prisma.company.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Company deleted' });
  } catch (err) {
    console.error(`[DELETE /api/companies/${req.params.id}]`, err);
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
