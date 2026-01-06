-- CreateTable
CREATE TABLE "platforms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "baseUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" BIGINT NOT NULL,
    "metadata" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT,
    "requestedBy" TEXT,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platforms_name_key" ON "platforms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_slug_key" ON "platforms"("slug");

-- CreateIndex
CREATE INDEX "platforms_slug_idx" ON "platforms"("slug");

-- CreateIndex
CREATE INDEX "platforms_isActive_idx" ON "platforms"("isActive");

-- CreateIndex
CREATE INDEX "metrics_platformId_resource_metricType_idx" ON "metrics"("platformId", "resource", "metricType");

-- CreateIndex
CREATE INDEX "metrics_expiresAt_idx" ON "metrics"("expiresAt");

-- CreateIndex
CREATE INDEX "metrics_fetchedAt_idx" ON "metrics"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_platformId_resource_metricType_fetchedAt_key" ON "metrics"("platformId", "resource", "metricType", "fetchedAt");

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
