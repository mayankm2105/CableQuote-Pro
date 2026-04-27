'use strict';

require('dotenv/config');
const express = require('express');
const cors    = require('cors');

const quotationsRoutes = require('./src/routes/quotations');
const companiesRoutes  = require('./src/routes/companies');
const cablesRoutes     = require('./src/routes/cables');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/quotations', quotationsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/cables', cablesRoutes);
app.get('/', (_req, res) => res.send('API running'));

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CableQuote API is running' });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
