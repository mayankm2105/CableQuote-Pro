'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ─── PDF Storage Directory ────────────────────────────────────────────────────
const PDF_DIR = path.join(__dirname, '..', '..', 'generated-pdfs');
const PROJECT_ROOT = path.join(__dirname, '..', '..');

function ensurePdfDir() {
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeAllowedTag(tag) {
  const t = String(tag || '').trim().toLowerCase();
  if (t.startsWith('<br')) return '<br/>';
  if (t === '<b>' || t === '</b>') return t;
  if (t === '<strong>' || t === '</strong>') return t;
  if (t === '<i>' || t === '</i>') return t;
  if (t === '<em>' || t === '</em>') return t;
  if (t === '<u>' || t === '</u>') return t;
  return '';
}

function sanitizeBasicInlineHtml(input) {
  // Allow only: <b>, <strong>, <i>, <em>, <u>, <br/>. Strip everything else.
  const raw = String(input ?? '');
  const tokens = [];

  let s = raw
    .replace(/<\s*(script|style)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\/?(?:b|strong|i|em|u)\b[^>]*>|<br\b[^>]*>/gi, (tag) => {
      const normalized = normalizeAllowedTag(tag);
      if (!normalized) return '';
      tokens.push(normalized);
      return `%%TOK${tokens.length - 1}%%`;
    })
    .replace(/<[^>]*>/g, '');

  s = escapeHtml(s);

  return s.replace(/%%TOK(\d+)%%/g, (_m, idx) => tokens[Number(idx)] || '');
}

function parseNumber(value) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').trim());
  return Number.isFinite(n) ? n : NaN;
}

function formatAmount(value) {
  const n = parseNumber(value);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(2);
}

function formatDate(input) {
  const date = input ? new Date(input) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function readImageAsBase64(absPath) {
  try {
    if (!fs.existsSync(absPath)) return null;
    const bytes = fs.readFileSync(absPath);
    return bytes.toString('base64');
  } catch {
    return null;
  }
}

const COMPANY_LOGO_PNG = path.join(PROJECT_ROOT, 'images', 'Company Logo.png');
const PLACEHOLDERS_JPEG = path.join(PROJECT_ROOT, 'images', 'Placeholders.jpeg');
const PLACEHOLDERS_PNG = path.join(PROJECT_ROOT, 'images', 'Placeholders.png');

const companyLogoBase64 = readImageAsBase64(COMPANY_LOGO_PNG);
const placeholdersBase64Jpeg = readImageAsBase64(PLACEHOLDERS_JPEG);
const placeholdersBase64Png = readImageAsBase64(PLACEHOLDERS_PNG);

const companyLogoDataUri = companyLogoBase64 ? `data:image/png;base64,${companyLogoBase64}` : '';
const placeholdersDataUri = placeholdersBase64Png
  ? `data:image/png;base64,${placeholdersBase64Png}`
  : placeholdersBase64Jpeg
    ? `data:image/jpeg;base64,${placeholdersBase64Jpeg}`
    : '';

function getTemplate(data) {
  const tagDisplay = (data.tag || '').replace(/^QTO\/?/i, '');
  const dateDisplay = formatDate(data.date);
  const clientName = data.client_name || '';
  const clientUnit = data.client_unit || '';
  const clientAddress = data.client_address || '';
  const enquiryNo = data.enquiry_no || '';

  const items = Array.isArray(data.cable_items) ? data.cable_items : [];
  const lineAmounts = items.map((item) => {
    const qty = parseNumber(item.quantity_meters);
    const rate = parseNumber(item.rate_per_meter);
    const amount = Number.isFinite(qty) && Number.isFinite(rate) ? qty * rate : NaN;
    return amount;
  });

  const totalAmount = lineAmounts.reduce((sum, a) => (Number.isFinite(a) ? sum + a : sum), 0);

  const tableRows = items
    .map((item, index) => {
      const amount = lineAmounts[index];
      return `
      <tr>
        <td class="center num">${index + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="center num">${escapeHtml(item.quantity_meters)}</td>
        <td class="right num">${escapeHtml(item.rate_per_meter)}</td>
        <td class="right num">${escapeHtml(formatAmount(amount))}</td>
      </tr>
    `;
    })
    .join('');

  const totalRow = `
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="right"><strong>TOTAL</strong></td>
        <td class="right num"><strong>₹ ${escapeHtml(formatAmount(totalAmount))}</strong></td>
      </tr>
  `;

  const termsInput = data?.terms || {};

  const forValue =
    typeof termsInput.forValue === 'string' && termsInput.forValue.trim()
      ? termsInput.forValue.trim()
      : 'FOR ARC TPT Godown Delivery';

  const freightValue =
    typeof termsInput.freightValue === 'string' && termsInput.freightValue.trim()
      ? termsInput.freightValue.trim()
      : 'EXTRA';

  const deliveryValue =
    typeof termsInput.deliveryValue === 'string' && termsInput.deliveryValue.trim()
      ? termsInput.deliveryValue.trim()
      : '4-5 weeks from our plant, Transit time extra 10-15 days';

  const validityValue =
    typeof termsInput.validityValue === 'string' && termsInput.validityValue.trim()
      ? termsInput.validityValue.trim()
      : 'The quoted rates are valid for 5 Days from the date of offer subject to prior confirmation thereafter.';

  const paymentValue =
    typeof termsInput.paymentValue === 'string' && termsInput.paymentValue.trim()
      ? termsInput.paymentValue.trim()
      : '45 days after receipt & approval of material';

  const insuranceValue =
    typeof termsInput.insuranceValue === 'string' && termsInput.insuranceValue.trim()
      ? termsInput.insuranceValue.trim()
      : 'NIL';

  // Fixed numbering must match the rendered PDF.
  // Manual values may contain simple HTML (<b>/<i>/<u>/<br/>). Render headings bold.
  const terms = [
    { label: 'F.O.R', valueHtml: sanitizeBasicInlineHtml(forValue) },
    { label: 'GST', valueHtml: sanitizeBasicInlineHtml('18% EXTRA') },
    { label: 'FREIGHT', valueHtml: sanitizeBasicInlineHtml(freightValue) },
    { label: 'MAKE', valueHtml: sanitizeBasicInlineHtml('Garmal Cable') },
    { label: 'DELIVERY', valueHtml: sanitizeBasicInlineHtml(deliveryValue) },
    { label: 'VALIDITY', valueHtml: sanitizeBasicInlineHtml(validityValue) },
    { label: 'PAYMENT', valueHtml: sanitizeBasicInlineHtml(paymentValue) },
    { label: 'TOLERANCE', valueHtml: sanitizeBasicInlineHtml('±5%') },
    { label: 'GUARANTEE', valueHtml: sanitizeBasicInlineHtml('18 months from the date of invoice') },
    { label: 'P & F', valueHtml: sanitizeBasicInlineHtml('NIL') },
    { label: 'INSURANCE', valueHtml: sanitizeBasicInlineHtml(insuranceValue) },
  ];

  const termsRows = terms
    .map((t) => `<li><strong>${escapeHtml(t.label)}:</strong> ${t.valueHtml}</li>`)
    .join('');

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Quotation ${escapeHtml(data.tag)}</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 10px;
        font-family: "Times New Roman", serif;
        color: #000;
        font-size: 13px;
        line-height: 1.15;
        box-sizing: border-box;
      }

      .page-border {
        margin: 0;
        padding: 10px;
        box-sizing: border-box;
      }

      .page {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 100%;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 4mm;
      }
      .header-left { flex: 1 1 auto; }
      .header-title {
        color: #b22222;
        font-weight: 700;
        font-size: 18px;
        margin-bottom: 0.5mm;
      }
      .header-address {
        white-space: pre-line;
        font-size: 11px;
        line-height: 1.15;
      }
      .header-right {
        flex: 0 0 140px;
        display: flex;
        justify-content: flex-end;
      }
      .logo { width: 120px; height: auto; }

      .quotation-title {
        text-align: center;
        font-weight: 700;
        font-size: 16px;
        letter-spacing: 0.4px;
        margin-bottom: 3mm;
      }

      .top-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3mm;
      }
      .top-item { font-size: 13px; }
      .top-item strong { font-weight: 700; }

      .client-box {
        border: 1px solid #000;
        padding: 6px 8px;
        margin-bottom: 3mm;
        page-break-inside: avoid;
      }
      .client-line { margin-bottom: 1mm; }
      .client-address {
        white-space: pre-line;
        margin-top: 1mm;
        margin-bottom: 1mm;
      }
      .label { font-weight: 700; }

      .body-text {
        margin: 0 0 3mm 0;
        white-space: pre-line;
        font-size: 13px;
        line-height: 1.12;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 2mm;
        page-break-inside: avoid;
      }
      th, td {
        border: 0.8px solid #000;
        padding: 5px 6px;
        vertical-align: middle;
      }
      th {
        background: #f0e4d3; /* light brown/gray */
        font-weight: 700;
        font-size: 12px;
      }

      .center { text-align: center; }
      .right { text-align: right; }
      .left { text-align: left; }
      .num { white-space: nowrap; }

      .terms {
        page-break-inside: avoid;
        margin-top: 3mm;
      }
      .terms-title {
        font-weight: 700;
        margin-bottom: 1mm;
        font-size: 13px;
      }
      ol {
        margin: 0;
        padding-left: 18px;
      }
      ol li {
        margin-bottom: 1.5mm;
        line-height: 1.12;
      }

      .footer {
        margin-top: 5mm;
        text-align: right;
        font-weight: 700;
        page-break-inside: avoid;
      }
      .signature-placeholder {
        width: 230px;
        margin-left: auto;
        border-bottom: 1px solid #000;
        height: 18px;
        margin-top: 6mm;
      }

      .bottom-center {
        text-align: center;
        margin-top: 5mm;
        font-weight: 700;
      }
      .bottom-center .sub {
        font-weight: 400;
        margin-top: 1mm;
      }
      .cert-img {
        margin-top: 2mm;
        width: 175px;
        height: auto;
      }

      .final-bottom-logos {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        margin-top: 25px;
        margin-bottom: 10px;
        width: 100%;
      }

      .final-bottom-logos img:first-child {
        height: 60px;
      }

      .final-bottom-logos img:not(:first-child) {
        height: 45px;
      }
    </style>
  </head>
  <body>
    <div class="page-border">
      <div class="page">
      <div class="header">
        <div class="header-left">
          <div class="header-title">G.M. INDUSTRIES</div>
          <div class="header-address">
KHASRA NO. 14/1/12, VILLAGE PALHERI
PALHERI FARIDPUR ROAD, PANIPAT
HARYANA-132104
Website: www.garmalcables.com
          </div>
        </div>
        <div class="header-right">
          ${companyLogoDataUri ? `<img class="logo" src="${companyLogoDataUri}" alt="Garmal Cables" />` : ''}
        </div>
      </div>

      <div class="quotation-title">QUOTATION</div>

      <div class="top-row">
        <div class="top-item left">
          <strong>Tag :</strong> ${escapeHtml(data.tag)}
        </div>
        <div class="top-item right">
          <strong>DATE:</strong> ${escapeHtml(dateDisplay)}
        </div>
      </div>

      <div class="client-box">
        <div class="client-line">
          <span class="label">M/S</span> ${escapeHtml(clientName)}
        </div>
        <div class="client-line">
          <span class="label">Unit:</span> ${escapeHtml(clientUnit)}
        </div>
        <div class="client-address">${escapeHtml(clientAddress)}</div>
        <div class="client-line" style="margin-top: 1mm;">
          <span class="label">ENQUIRY NO:</span> ${escapeHtml(enquiryNo)}
        </div>
      </div>

      <div class="body-text">
Dear Sir,
As per your inquiry we are pleased to quote our lowest possible prices along with terms &amp; conditions for your kind consideration.
      </div>

      <table>
        <thead>
          <tr>
            <th class="center" style="width: 10%;">S.NO</th>
            <th class="left" style="width: 42%;">DESCRIPTION</th>
            <th class="center" style="width: 16%;">QUANTITY</th>
            <th class="right" style="width: 16%;">RS/METER</th>
            <th class="right" style="width: 16%;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          ${totalRow}
        </tbody>
      </table>

      <div class="terms">
        <div class="terms-title">TERMS &amp; CONDITIONS</div>
        <ol>
          ${termsRows}
        </ol>
      </div>

      <div class="footer">
        For G.M. INDUSTRIES<br/>
        Authorized Signatory
        <div class="signature-placeholder"></div>
      </div>

      <div class="bottom-center">
        G.M. INDUSTRIES
        <div class="sub">Manufacturer of Control &amp; Instrumentation Cables</div>
        ${placeholdersDataUri ? `<img class="cert-img" src="${placeholdersDataUri}" alt="Certifications" />` : ''}
      </div>

      <div class="final-bottom-logos">
        ${placeholdersBase64Png ? `<img src="data:image/png;base64,${placeholdersBase64Png}" />` : ''}
      </div>
      </div>
    </div>
  </body>
</html>
`;
}

/**
 * Generate a PDF for a quotation and save it to disk.
 * Returns the PDF buffer.
 * @param {object} data  - quotation object including cable_items
 * @param {string} unitId - the company unit_id for file naming
 */
async function generateQuotationPDF(data, unitId) {
  ensurePdfDir();

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(getTemplate(data), { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10px',
        right: '10px',
        bottom: '80px',
        left: '10px',
      },
    });

    // Build the filename: replace slashes in tag with underscores
    const tagSlug = (data.tag || `quotation_${data.id}`).replace(/\//g, '_');
    const safeUnitId = (unitId || 'UNKNOWN').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${tagSlug}_${safeUnitId}.pdf`;
    const filePath = path.join(PDF_DIR, filename);

    fs.writeFileSync(filePath, pdfBuffer);

    return { buffer: pdfBuffer, filename };
  } finally {
    await browser.close();
  }
}

/**
 * Delete all PDF files in the generated-pdfs directory.
 */
function deleteAllGeneratedPdfs() {
  if (!fs.existsSync(PDF_DIR)) return;
  const files = fs.readdirSync(PDF_DIR);
  for (const file of files) {
    if (file.endsWith('.pdf')) {
      try {
        fs.unlinkSync(path.join(PDF_DIR, file));
      } catch (e) {
        console.error(`[deleteAllGeneratedPdfs] Failed to delete ${file}:`, e.message);
      }
    }
  }
}

module.exports = {
  generateQuotationPDF,
  deleteAllGeneratedPdfs,
};
