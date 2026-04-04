const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const now = new Date('2026-03-27T00:00:00.000Z'); // current date as seed anchor

  // Determine the current Indian financial year
  // FY runs April 1 → March 31
  const month = now.getUTCMonth() + 1; // 1-indexed
  const year  = now.getUTCFullYear();

  const fyStartYear = month >= 4 ? year : year - 1;
  const fyEndYear   = fyStartYear + 1;

  // Label format: "YY-YY" e.g. "25-26"
  const label      = `${String(fyStartYear).slice(-2)}-${String(fyEndYear).slice(-2)}`;
  const start_date = new Date(`${fyStartYear}-04-01`);
  const end_date   = new Date(`${fyEndYear}-03-31`);

  const fy = await prisma.financialYear.upsert({
    where:  { label },
    update: {},
    create: { label, start_date, end_date, counter: 0 },
  });

  console.log(`✔  Financial year seeded: ${fy.label} (id: ${fy.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
