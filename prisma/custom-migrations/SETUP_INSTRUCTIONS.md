# Setup Instructions for Usage Metrics

## Prerequisites

Before running the custom migration for usage metrics, you must ensure the main database schema is set up.

## Step-by-Step Setup

### 1. Verify Database Connection

Make sure your `.env` file has the correct `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

### 2. Apply Main Prisma Migrations First

**IMPORTANT:** The custom migration depends on existing tables (`prompts` and `users`). You must run the main Prisma migrations before applying the custom migration.

```bash
# Generate Prisma client
npm run db:generate

# Apply all Prisma migrations
npm run db:migrate
```

Or manually:

```bash
npx prisma generate
npx prisma migrate deploy
```

### 3. Verify Main Tables Exist

Check that the required tables exist:

```bash
psql $DATABASE_URL -c "\dt"
```

You should see tables including:
- `users`
- `prompts`
- `categories`
- `tags`
- etc.

### 4. Apply Custom Migration

Only after the main schema is set up, apply the custom migration:

```bash
psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics.sql
```

### 5. Verify Custom Tables

Check that the new tables were created:

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

### Error: "relation 'prompts' does not exist"

**Cause:** The main Prisma schema hasn't been applied to the database.

**Solution:**
1. Run `npm run db:migrate` to apply all Prisma migrations
2. Then run the custom migration

### Error: "database does not exist"

**Cause:** The database specified in `DATABASE_URL` doesn't exist.

**Solution:**
```bash
# Create the database
createdb your_database_name

# Or using psql
psql -U postgres -c "CREATE DATABASE your_database_name;"
```

### Error: "permission denied"

**Cause:** Database user doesn't have sufficient permissions.

**Solution:**
```bash
# Grant permissions (as superuser)
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_user;"
```

### Starting Fresh

If you need to start from scratch:

```bash
# Drop and recreate database
dropdb your_database_name
createdb your_database_name

# Apply all migrations
npm run db:migrate

# Apply custom migration
psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics.sql
```

## Development Workflow

For local development:

1. **First time setup:**
   ```bash
   npm install
   npm run db:migrate
   psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics.sql
   npm run dev
   ```

2. **After pulling changes:**
   ```bash
   npm run db:migrate  # Apply any new Prisma migrations
   # Custom migration already applied, no need to rerun
   npm run dev
   ```

3. **If you need to reset:**
   ```bash
   # Rollback custom migration
   psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics_rollback.sql
   
   # Reset Prisma migrations
   npx prisma migrate reset
   
   # Reapply custom migration
   psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics.sql
   ```

## Production Deployment

For production:

1. Ensure `DATABASE_URL` points to production database
2. Run `npm run db:migrate` (applies Prisma migrations)
3. Run custom migration: `psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics.sql`
4. Deploy application code

## Verification

After setup, verify everything works:

```bash
# Check all tables exist
psql $DATABASE_URL -c "\dt"

# Check custom tables
psql $DATABASE_URL -c "SELECT * FROM prompt_usage_logs LIMIT 1;"
psql $DATABASE_URL -c "SELECT * FROM prompt_usage_metrics LIMIT 1;"

# Check enum type
psql $DATABASE_URL -c "\dT+ \"UsageType\""
```

## Need Help?

If you continue to have issues:

1. Check that `DATABASE_URL` is correct
2. Verify database exists and is accessible
3. Ensure you have the correct permissions
4. Check PostgreSQL logs for detailed errors
5. Review the main README.md for general setup instructions
