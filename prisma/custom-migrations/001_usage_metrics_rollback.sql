-- Rollback Migration: 001_usage_metrics
-- Description: Remove usage tracking tables and enum
-- Date: 2026-02-18

-- Drop foreign key constraints first
ALTER TABLE "prompt_usage_logs" DROP CONSTRAINT IF EXISTS "prompt_usage_logs_promptId_fkey";
ALTER TABLE "prompt_usage_logs" DROP CONSTRAINT IF EXISTS "prompt_usage_logs_usedBy_fkey";
ALTER TABLE "prompt_usage_metrics" DROP CONSTRAINT IF EXISTS "prompt_usage_metrics_promptId_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "prompt_usage_logs_promptId_idx";
DROP INDEX IF EXISTS "prompt_usage_logs_usedBy_idx";
DROP INDEX IF EXISTS "prompt_usage_logs_usageType_idx";
DROP INDEX IF EXISTS "prompt_usage_logs_usedAt_idx";

-- Drop tables
DROP TABLE IF EXISTS "prompt_usage_metrics";
DROP TABLE IF EXISTS "prompt_usage_logs";

-- Drop enum type
DROP TYPE IF EXISTS "UsageType";
