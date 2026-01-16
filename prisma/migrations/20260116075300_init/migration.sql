-- CreateTable
CREATE TABLE "platforms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "base_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "platform_id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "value" BIGINT NOT NULL,
    "metadata" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "request_id" TEXT,
    "requested_by" TEXT,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_tokens" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_metrics" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "interval_minutes" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "next_run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_fetched_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notify_only_changed" BOOLEAN NOT NULL DEFAULT false,
    "last_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "scheduled_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platforms_name_key" ON "platforms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_slug_key" ON "platforms"("slug");

-- CreateIndex
CREATE INDEX "platforms_slug_idx" ON "platforms"("slug");

-- CreateIndex
CREATE INDEX "platforms_is_active_idx" ON "platforms"("is_active");

-- CreateIndex
CREATE INDEX "metrics_platform_id_resource_metric_type_idx" ON "metrics"("platform_id", "resource", "metric_type");

-- CreateIndex
CREATE INDEX "metrics_expires_at_idx" ON "metrics"("expires_at");

-- CreateIndex
CREATE INDEX "metrics_fetched_at_idx" ON "metrics"("fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_platform_id_resource_metric_type_fetched_at_key" ON "metrics"("platform_id", "resource", "metric_type", "fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "platform_tokens_platform_key" ON "platform_tokens"("platform");

-- CreateIndex
CREATE INDEX "platform_tokens_platform_idx" ON "platform_tokens"("platform");

-- CreateIndex
CREATE INDEX "platform_tokens_expires_at_idx" ON "platform_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "scheduled_metrics_platform_resource_resource_id_idx" ON "scheduled_metrics"("platform", "resource", "resource_id");

-- CreateIndex
CREATE INDEX "scheduled_metrics_is_active_expires_at_idx" ON "scheduled_metrics"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "scheduled_metrics_next_run_at_idx" ON "scheduled_metrics"("next_run_at");

-- CreateIndex
CREATE INDEX "scheduled_metrics_last_fetched_at_idx" ON "scheduled_metrics"("last_fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_metrics_platform_resource_resource_id_metric_key" ON "scheduled_metrics"("platform", "resource", "resource_id", "metric");

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
