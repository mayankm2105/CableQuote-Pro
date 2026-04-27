'use strict';

const prisma = require('../lib/prisma');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the Indian financial year label for a given date.
 * FY runs April 1 → March 31.
 * Example: any date in Apr 2026 – Mar 2027 → "26-27"
 *
 * @param {Date} [date=new Date()] - reference date (defaults to now)
 * @returns {string} e.g. "26-27"
 */
function getCurrentFinancialYearLabel(date = new Date()) {
  const month = date.getMonth() + 1; // 1-indexed
  const year  = date.getFullYear();

  const startYear = month >= 4 ? year : year - 1;
  const endYear   = startYear + 1;

  const yy  = (y) => String(y).slice(-2);
  return `${yy(startYear)}-${yy(endYear)}`;
}

// ─── DB Operations ──────────────────────────────────────────────────────────

/**
 * Fetches the financial_year row for the current Indian FY.
 * Creates it if it does not exist (upsert — idempotent).
 *
 * @returns {Promise<import('@prisma/client').FinancialYear>}
 */
async function getOrCreateFinancialYear() {
  const now   = new Date();
  const label = getCurrentFinancialYearLabel(now);

  const month     = now.getMonth() + 1;
  const year      = now.getFullYear();
  const startYear = month >= 4 ? year : year - 1;
  const endYear   = startYear + 1;

  const fy = await prisma.financialYear.upsert({
    where:  { label },
    update: {},
    create: {
      label,
      start_date: new Date(`${startYear}-04-01`),
      end_date:   new Date(`${endYear}-03-31`),
      counter:    0,
    },
  });

  return fy;
}

// ─── Tag Generation ─────────────────────────────────────────────────────────

/**
 * Atomically increments the FY counter and returns a unique quotation tag.
 *
 * Uses a serializable transaction + raw UPDATE … RETURNING to lock the row
 * and prevent duplicate serial numbers under concurrent requests.
 *
 * Tag format: QTO/{FY}/GMI/{SERIAL}
 * Example:    QTO/26-27/GMI/1
 *
 * @returns {Promise<{ tag: string, serialNumber: number, fyId: number }>}
 */
async function generateQuotationTag() {
  const result = await prisma.$transaction(
    async (tx) => {
      // Ensure the FY row exists first (outside the lock is fine —
      // upsert is idempotent and only races on first call per FY).
      const fy = await getOrCreateFinancialYear();

      // Atomically increment counter and return the new value.
      // Using raw SQL UPDATE … RETURNING guarantees no two concurrent
      // transactions see the same counter value.
      const [updated] = await tx.$queryRaw`
        UPDATE financial_years
        SET    counter = counter + 1
        WHERE  id      = ${fy.id}
        RETURNING id, label, counter
      `;

      const serialNumber = updated.counter;
      const tag = `QTO/${updated.label}/GMI/${serialNumber}`;

      return { tag, serialNumber, fyId: updated.id };
    },
    {
      isolationLevel: 'Serializable',
    }
  );

  return result;
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  getCurrentFinancialYearLabel,
  getOrCreateFinancialYear,
  generateQuotationTag,
};
