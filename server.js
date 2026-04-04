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
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://cable-quote-pro.vercel.app',
    /^https:\/\/cable-quote-pro.*\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/quotations', quotationsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/cables', cablesRoutes);
app.get('/', (_req, res) => res.send('API running'));

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  CableQuote API running at http://localhost:${PORT}`);
});

module.exports = app;
