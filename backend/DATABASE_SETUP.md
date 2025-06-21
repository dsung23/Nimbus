# Database Setup Guide - Fixed System

## Overview

This guide covers the corrected database setup for the CoFund personal finance app. All the issues mentioned in the feedback have been addressed.

## ✅ Issues Fixed

1. **UUID Extension**: Now uses `uuid-ossp` extension with `uuid_generate_v4()` function
2. **Migration Path Issues**: Corrected paths and simplified migration approach
3. **exec_sql Dependency**: Removed dependency on non-existent `exec_sql` function
4. **Schema Validation Consistency**: All required fields match between JS and SQL
5. **Test Connection**: Fixed to use proper Supabase connection test
6. **Dual Migration Strategy**: Simplified to one clear approach

## Quick Setup

### Option 1: Manual SQL Execution (Recommended)

1. **Generate the complete SQL:**
   ```bash
   npm run db:setup
   ```

2. **Copy the generated SQL:**
   - Open `database-setup.sql` in your project root
   - Copy all contents

3. **Execute in Supabase:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Paste and execute the SQL

### Option 2: Use Migration System

1. **Create a new migration:**
   ```bash
   npm run migrate:create initial_schema "Initial database setup"
   ```

2. **Copy the migration SQL:**
   - Open the generated migration file in `src/migrations/`
   - Copy the SQL content

3. **Execute in Supabase:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Paste and execute the SQL

## Available Commands

### Database Setup
```bash
npm run db:setup          # Generate complete database setup SQL
npm run db:generate-sql   # Print complete SQL to console
npm run db:test          # Test database connection
npm run db:init          # Show schema information (reference only)
```

### Migration System
```bash
npm run migrate          # Run pending migrations (manual execution)
npm run migrate:create   # Create new migration file
npm run migrate:status   # Show migration status
```

## Database Schema

The system includes these tables:

### Core Tables
- **users**: User profiles and authentication
- **accounts**: Bank accounts from Plaid
- **transactions**: Transaction history from Plaid
- **chat_sessions**: LLM chatbot conversation sessions
- **chat_messages**: Individual chat messages

### Key Features
- **UUID Primary Keys**: Using `uuid_generate_v4()` from `uuid-ossp` extension
- **Row Level Security**: All tables have RLS enabled
- **Proper Indexes**: Optimized for common queries
- **Foreign Key Constraints**: Maintains data integrity
- **JSONB Fields**: For flexible data storage

## Environment Variables

Make sure your `.env` file has:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Testing Your Setup

1. **Test connection:**
   ```bash
   npm run db:test
   ```

2. **Verify tables exist:**
   - Go to Supabase dashboard
   - Navigate to Table Editor
   - You should see: users, accounts, transactions, chat_sessions, chat_messages

3. **Check RLS policies:**
   - Go to Authentication > Policies
   - Verify policies are created for each table

## Development Workflow

### Adding New Tables

1. **Create schema definition:**
   ```javascript
   // src/schemas/newTableSchema.js
   const newTableSchema = {
     tableName: 'new_table',
     createTableSQL: `CREATE TABLE IF NOT EXISTS new_table (...)`,
     indexes: [...],
     rlsPolicies: [...],
     validation: {...}
   };
   ```

2. **Add to schemas index:**
   ```javascript
   // src/schemas/index.js
   const newTableSchema = require('./newTableSchema');
   module.exports = { ..., newTableSchema };
   ```

3. **Generate migration:**
   ```bash
   npm run migrate:create add_new_table "Add new table for feature"
   ```

4. **Execute in Supabase:**
   - Copy migration SQL to Supabase SQL Editor
   - Execute the SQL

### Modifying Existing Tables

1. **Create migration:**
   ```bash
   npm run migrate:create modify_existing_table "Add new column"
   ```

2. **Add ALTER TABLE statements:**
   ```sql
   ALTER TABLE existing_table ADD COLUMN new_column VARCHAR(255);
   ```

3. **Execute in Supabase**

## Troubleshooting

### Common Issues

1. **"function uuid_generate_v4() does not exist"**
   - Ensure `uuid-ossp` extension is enabled
   - Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

2. **"relation does not exist"**
   - Check if tables were created successfully
   - Verify SQL execution in Supabase

3. **Connection errors**
   - Verify environment variables
   - Check Supabase project status

4. **RLS policy errors**
   - Ensure policies are created after tables
   - Check policy syntax

### Getting Help

1. **Check Supabase logs** in the dashboard
2. **Verify SQL syntax** before execution
3. **Test connection** with `npm run db:test`
4. **Generate fresh SQL** with `npm run db:setup`

## Production Deployment

For production:

1. **Use migrations** for schema changes
2. **Test all changes** in development first
3. **Backup data** before major schema changes
4. **Monitor RLS policies** for security
5. **Use proper environment variables** for each environment

## Schema Validation

The system includes validation rules for each schema:

```javascript
// Example validation
validation: {
  email: {
    required: true,
    type: 'string',
    format: 'email',
    maxLength: 255
  }
}
```

Use the validation in your application code:

```javascript
const { validateData } = require('./src/utils/database');
const validation = validateData('userSchema', userData);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

## UUID Extension Details

The system uses the `uuid-ossp` extension which provides:
- `uuid_generate_v4()`: Generates random UUIDs
- `uuid_generate_v1()`: Generates time-based UUIDs
- `uuid_generate_v3()`: Generates name-based UUIDs (MD5)
- `uuid_generate_v5()`: Generates name-based UUIDs (SHA-1)

For the CoFund app, we use `uuid_generate_v4()` for all primary keys as it provides:
- **Uniqueness**: Extremely low collision probability
- **Security**: No predictable patterns
- **Performance**: Fast generation
- **Compatibility**: Works with all UUID libraries

This setup provides a robust, secure, and maintainable database foundation for your CoFund personal finance app. 