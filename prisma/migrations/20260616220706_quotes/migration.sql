-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "closeCents" INTEGER NOT NULL,
    CONSTRAINT "Quote_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Quote_assetId_idx" ON "Quote"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_assetId_date_key" ON "Quote"("assetId", "date");
