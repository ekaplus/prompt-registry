-- Migration: 001_usage_metrics
-- Description: Add usage tracking tables for prompts (copy, download, run operations)
-- Date: 2026-02-18

-- Create UsageType enum
CREATE TYPE "UsageType" AS ENUM ('COPY', 'DOWNLOAD', 'RUN');

-- Create prompt_usage_logs table
CREATE TABLE "prompt_usage_logs" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "usageType" "UsageType" NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedBy" TEXT,
    "platform" TEXT,

    CONSTRAINT "prompt_usage_logs_pkey" PRIMARY KEY ("id")
);

-- Create prompt_usage_metrics table
CREATE TABLE "prompt_usage_metrics" (
    "promptId" TEXT NOT NULL,
    "copiedCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_usage_metrics_pkey" PRIMARY KEY ("promptId")
);

-- Create indexes for prompt_usage_logs
CREATE INDEX "prompt_usage_logs_promptId_idx" ON "prompt_usage_logs"("promptId");
CREATE INDEX "prompt_usage_logs_usedBy_idx" ON "prompt_usage_logs"("usedBy");
CREATE INDEX "prompt_usage_logs_usageType_idx" ON "prompt_usage_logs"("usageType");
CREATE INDEX "prompt_usage_logs_usedAt_idx" ON "prompt_usage_logs"("usedAt");

-- Add foreign key constraints
ALTER TABLE "prompt_usage_logs" ADD CONSTRAINT "prompt_usage_logs_promptId_fkey" 
    FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prompt_usage_logs" ADD CONSTRAINT "prompt_usage_logs_usedBy_fkey" 
    FOREIGN KEY ("usedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prompt_usage_metrics" ADD CONSTRAINT "prompt_usage_metrics_promptId_fkey" 
    FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add comments for documentation
COMMENT ON TABLE "prompt_usage_logs" IS 'Detailed log of all prompt usage events (copy, download, run)';
COMMENT ON TABLE "prompt_usage_metrics" IS 'Aggregated usage metrics per prompt for fast queries';
COMMENT ON COLUMN "prompt_usage_logs"."usedBy" IS 'User ID who performed the action (null for anonymous users)';
COMMENT ON COLUMN "prompt_usage_logs"."platform" IS 'Platform name for RUN actions (e.g., ChatGPT, Claude)';
