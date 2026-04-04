'use strict';

const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// GET /api/cables
router.get('/', async (req, res) => {
  try {
    const cables = await prisma.cable.findMany({
      orderBy: { id: 'asc' },
    });
    return res.json({ success: true, data: cables });
  } catch (err) {
    console.error('[GET /api/cables]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/cables
router.post('/', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description?.trim()) {
      return res.status(400).json({ success: false, message: 'description is required' });
    }

    const cable = await prisma.cable.create({
      data: {
        description: description.trim(),
      },
    });

    return res.status(201).json({ success: true, data: cable });
  } catch (err) {
    console.error('[POST /api/cables]', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Cable description must be unique' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/cables/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    await prisma.cable.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Cable deleted' });
  } catch (err) {
    console.error(`[DELETE /api/cables/${req.params.id}]`, err);
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Cable not found' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
