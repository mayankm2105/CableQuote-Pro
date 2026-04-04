-- CreateTable
CREATE TABLE "financial_years" (
    "id" SERIAL NOT NULL,
    "label" VARCHAR(10) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "financial_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" SERIAL NOT NULL,
    "tag" VARCHAR(50) NOT NULL,
    "fy_id" INTEGER NOT NULL,
    "serial_number" INTEGER NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "client_unit" VARCHAR(255) NOT NULL,
    "client_address" TEXT NOT NULL,
    "enquiry_no" VARCHAR(100) NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cable_items" (
    "id" SERIAL NOT NULL,
    "quotation_id" INTEGER NOT NULL,
    "sno" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity_meters" INTEGER NOT NULL,
    "rate_per_meter" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "cable_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_years_label_key" ON "financial_years"("label");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_tag_key" ON "quotations"("tag");

-- CreateIndex
CREATE INDEX "quotations_fy_id_idx" ON "quotations"("fy_id");

-- CreateIndex
CREATE INDEX "cable_items_quotation_id_idx" ON "cable_items"("quotation_id");

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_fy_id_fkey" FOREIGN KEY ("fy_id") REFERENCES "financial_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cable_items" ADD CONSTRAINT "cable_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
