# Custom Database Migrations

This directory contains custom database migrations that are managed separately from Prisma's automatic migration system. This approach ensures that feature-specific schema changes remain isolated and don't interfere with upstream synchronization.

## Why Custom Migrations?

- **Upstream Compatibility**: Keeps feature additions separate from Prisma's managed migrations
- **Easy Rollback**: Each migration has a corresponding rollback script
- **Feature Isolation**: Changes can be removed without affecting core schema
- **Merge Safety**: Reduces conflicts when syncing with upstream repository

## Structure

Each migration consists of:
- `XXX_migration_name.sql` - Forward migration
- `XXX_migration_name_rollback.sql` - Rollback script
- `schema-extension.prisma` - Prisma model definitions (for reference only)

## How to Apply Migrations

### Prerequisites

**IMPORTANT:** Before applying custom migrations, you must first apply the main Prisma schema migrations.

1. PostgreSQL client tools installed
2. `DATABASE_URL` environment variable set
3. **Main Prisma migrations already applied** (run `npm run db:migrate` first)

### Apply Migration

```bash
# STEP 1: Apply main Prisma migrations (if not already done)
npm run db:migrate

# STEP 2: Verify main tables exist
psql $DATABASE_URL -c "\dt" | grep -E "(prompts|users)"

# STEP 3: Apply custom migration
psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics.sql
```

**If you get "relation 'prompts' does not exist" error:**
This means the main Prisma schema hasn't been applied. Run `npm run db:migrate` first, then retry the custom migration.

### Rollback Migration

```bash
# Load environment variables
source .env

# Rollback migration
psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics_rollback.sql
```

## Important Notes

1. **Do NOT run `prisma migrate`** on these custom migrations
2. **Do NOT regenerate Prisma client** after applying these migrations (unless you manually add the models to schema.prisma)
3. These migrations are designed to work alongside Prisma's managed migrations
4. The `schema-extension.prisma` file is for documentation only - it shows what the models would look like in Prisma format

## Current Migrations

### 001_usage_metrics.sql

Adds usage tracking tables for prompts:
- `prompt_usage_logs` - Detailed log of all usage events
- `prompt_usage_metrics` - Aggregated metrics per prompt
- `UsageType` enum - COPY, DOWNLOAD, RUN

**Purpose**: Track copy, download, and run operations on prompts and skills.

**Rollback**: `001_usage_metrics_rollback.sql`

## Verification

After applying a migration, verify the tables exist:

```bash
psql $DATABASE_URL -c "\dt prompt_usage*"
```

Expected output:
```
                    List of relations
 Schema |         Name          | Type  |  Owner   
--------+-----------------------+-------+----------
 public | prompt_usage_logs     | table | postgres
 public | prompt_usage_metrics  | table | postgres
```

## Troubleshooting

### Migration fails with "relation already exists"

The migration has already been applied. Check with:
```bash
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'prompt_usage%';"
```

### Need to reapply migration

First rollback, then apply:
```bash
psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics_rollback.sql
psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics.sql
```

## Best Practices

1. Always test migrations in development first
2. Keep rollback scripts up to date
3. Document any manual schema changes
4. Coordinate with team before applying in production
5. Backup database before applying migrations
