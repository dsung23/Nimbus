# Database Migrations Guide

## Overview

The CoFund backend uses a custom migration system designed specifically for Supabase. This system helps you manage database schema changes in a version-controlled, repeatable way.

## Migration System Features

- **Version Control**: Tracks which migrations have been executed
- **Checksum Validation**: Ensures migration files haven't been modified
- **CLI Interface**: Easy-to-use command line tools
- **Supabase Integration**: Works seamlessly with Supabase PostgreSQL
- **Rollback Support**: Track migration history for potential rollbacks

## Quick Start

### 1. Set up your environment
Make sure your `.env` file has the required Supabase credentials:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Run initial migration
```bash
npm run migrate
```

### 3. Check migration status
```bash
npm run migrate:status
```

## Available Commands

### Run Migrations
```bash
npm run migrate
# or
node src/utils/migrations.js run
```
Executes all pending migrations in order.

### Create New Migration
```bash
npm run migrate:create <migration_name> [description]
# or
node src/utils/migrations.js create <migration_name> [description]
```
Creates a new migration file with a timestamp prefix.

**Examples:**
```bash
npm run migrate:create add_user_preferences "Add user preferences table"
npm run migrate:create update_transaction_categories "Update transaction category structure"
```

### Check Migration Status
```bash
npm run migrate:status
# or
node src/utils/migrations.js status
```
Shows which migrations have been executed and which are pending.

## Migration File Structure

Migration files are stored in `src/migrations/` and follow this naming convention:
```
YYYYMMDDHHMMSS_migration_name.sql
```

Example: `20240101120000_initial_schema.sql`

## Creating a Migration

When you create a new migration, it will generate a template like this:

```sql
-- Migration: migration_name
-- Description: Your description here
-- Created: 2024-01-01T12:00:00.000Z

-- Add your SQL here
-- Example:
-- CREATE TABLE example_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Don't forget to add indexes if needed
-- CREATE INDEX idx_example_table_name ON example_table(name);

-- And RLS policies for Supabase
-- ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own data" ON example_table FOR SELECT USING (auth.uid() = user_id);
```

## Best Practices

### 1. Always Use IF NOT EXISTS
```sql
CREATE TABLE IF NOT EXISTS new_table (
  -- table definition
);
```

### 2. Add Indexes for Performance
```sql
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);
```

### 3. Enable RLS for Security
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON table_name FOR SELECT USING (auth.uid() = user_id);
```

### 4. Use Descriptive Names
- `add_user_preferences` ✅
- `update_001` ❌

### 5. Include Rollback Considerations
Think about how to undo your changes if needed.

## Migration Examples

### Adding a New Table
```sql
-- Migration: add_budgets_table
-- Description: Add budget tracking functionality

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category VARCHAR(100),
  period VARCHAR(20) NOT NULL, -- monthly, weekly, yearly
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);
```

### Adding a Column
```sql
-- Migration: add_user_timezone
-- Description: Add timezone support for users

ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
```

### Modifying Data
```sql
-- Migration: update_existing_data
-- Description: Update existing transaction categories

UPDATE transactions 
SET primary_category = 'Food & Dining' 
WHERE primary_category = 'Food';
```

## Troubleshooting

### Migration Fails
1. Check your Supabase credentials in `.env`
2. Verify the SQL syntax in your migration file
3. Check Supabase logs for detailed error messages
4. Ensure you have the necessary permissions

### Migration Already Executed
The system tracks executed migrations in the `schema_migrations` table. If a migration fails partway through, you may need to manually clean up and retry.

### Checksum Mismatch
If you modify an already-executed migration file, the system will detect the checksum mismatch and prevent execution. This is a safety feature.

## Database Utilities

Additional database utilities are available:

### Test Database Connection
```bash
npm run db:test
```

### Initialize Database (Alternative to migrations)
```bash
npm run db:init
```

## Integration with Development Workflow

1. **Create migration** when you need schema changes
2. **Test locally** with your development database
3. **Commit migration files** to version control
4. **Deploy** - migrations will run automatically
5. **Monitor** migration status in production

## Migration vs Supabase Dashboard

While you can make changes directly in the Supabase dashboard, using migrations provides:
- **Version control** for schema changes
- **Team collaboration** on database changes
- **Reproducible deployments**
- **Rollback capabilities**
- **Audit trail** of changes

For production environments, always use migrations rather than manual dashboard changes. 