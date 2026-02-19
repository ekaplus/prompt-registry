# Quick Start - Usage Metrics Setup

## Error: "relation 'prompts' does not exist"

This error means you need to apply the main Prisma migrations first.

## Correct Setup Order

```bash
# 1. Apply main Prisma schema (creates prompts, users, etc.)
npm run db:migrate

# 2. Apply custom usage metrics migration
psql $DATABASE_URL -f prisma/custom-migrations/001_usage_metrics.sql

# 3. Start dev server
npm run dev
```

## Verify Setup

```bash
# Check main tables exist
psql $DATABASE_URL -c "\dt" | grep prompts

# Check custom tables exist
psql $DATABASE_URL -c "\dt prompt_usage*"
```

## That's it!

Visit `http://localhost:3000/prompts/metrics` to see the metrics leaderboard.

For detailed instructions, see `SETUP_INSTRUCTIONS.md`
