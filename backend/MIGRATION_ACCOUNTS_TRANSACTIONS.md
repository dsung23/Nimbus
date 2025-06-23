# Accounts and Transactions Tables Migration

## 📋 **Overview**

This migration creates comprehensive database tables for accounts and transactions in the CoFund personal finance app. These tables form the core of the financial data management system and are designed to integrate with the Teller API.

## 🗄️ **Tables Created**

### **1. Accounts Table**
- **Purpose**: Store bank account information from Teller API integration
- **Key Features**:
  - Support for multiple account types (checking, savings, credit, investment, loan, other)
  - Teller API integration with sync status tracking
  - Account balance management
  - User preferences (color, icon, notes)
  - Primary account designation

### **2. Transactions Table**
- **Purpose**: Store all financial transactions from linked accounts
- **Key Features**:
  - Teller API integration with transaction mapping
  - Categorization and tagging support
  - Recurring transaction tracking
  - Transaction status management
  - User customization fields

## 🚀 **How to Apply the Migration**

### **Option 1: Using Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Execute the Migration**
   - Copy the contents of `src/migrations/002_create_accounts_transactions_tables.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify the Migration**
   - Check the "Table Editor" to confirm tables were created
   - Verify indexes are present
   - Confirm RLS policies are active

### **Option 2: Using Your Migration System**

1. **Set Environment Variables**
   ```bash
   export SUPABASE_URL="your_supabase_url"
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   ```

2. **Run Migration**
   ```bash
   cd backend
   npm run migrate
   ```

3. **Check Status**
   ```bash
   npm run migrate:status
   ```

## 🔧 **Database Features**

### **Row Level Security (RLS)**
- All tables have RLS enabled
- Users can only access their own data
- Automatic data isolation between users

### **Automatic Triggers**
- **Updated Timestamp**: Automatically updates `updated_at` on record changes
- **Primary Account**: Ensures only one primary account per user
- **Transaction Validation**: Validates transaction amounts and types
- **Balance Updates**: Automatically updates account balances when transactions change

### **Performance Indexes**
- User-based queries (most common)
- Date-based queries (for reporting)
- Teller API ID lookups
- Category and merchant filtering
- Composite indexes for complex queries

## 📊 **Table Structure**

### **Accounts Table (25 columns)**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- name (VARCHAR(100), Required)
- type (VARCHAR(50), Required, Check Constraint)
- institution (VARCHAR(100))
- account_number (VARCHAR(50))
- routing_number (VARCHAR(20))
- balance (DECIMAL(15,2), Default 0.00)
- available_balance (DECIMAL(15,2), Default 0.00)
- currency (VARCHAR(3), Default 'USD')
- teller_account_id (VARCHAR(255), Unique)
- teller_institution_id (VARCHAR(255))
- last_sync (TIMESTAMP WITH TIME ZONE)
- sync_status (VARCHAR(20), Default 'pending')
- is_active (BOOLEAN, Default TRUE)
- is_primary (BOOLEAN, Default FALSE)
- notes (TEXT)
- color (VARCHAR(7), Default '#3B82F6')
- icon (VARCHAR(50))
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)
```

### **Transactions Table (30 columns)**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- account_id (UUID, Foreign Key to accounts)
- amount (DECIMAL(15,2), Required)
- type (VARCHAR(20), Required, Check Constraint)
- description (TEXT, Required)
- date (DATE, Required)
- posted_date (DATE)
- teller_transaction_id (VARCHAR(255), Unique)
- teller_category (VARCHAR(100))
- teller_merchant (VARCHAR(255))
- teller_location (VARCHAR(255))
- category_id (UUID, Future Foreign Key)
- subcategory_id (UUID, Future Foreign Key)
- user_category (VARCHAR(100))
- user_merchant (VARCHAR(255))
- tags (TEXT[])
- notes (TEXT)
- is_recurring (BOOLEAN, Default FALSE)
- recurring_id (UUID)
- recurring_pattern (VARCHAR(50))
- recurring_interval (INTEGER, Default 1)
- status (VARCHAR(20), Default 'posted')
- is_verified (BOOLEAN, Default FALSE)
- check_number (VARCHAR(20))
- reference_number (VARCHAR(50))
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)
```

## 🔒 **Security Features**

### **Data Validation**
- Check constraints on account types and transaction types
- Amount validation (positive for income, negative for expense)
- Proper foreign key relationships
- Unique constraints on Teller API IDs

### **Access Control**
- Row Level Security policies
- User-based data isolation
- Automatic ownership verification

## 📈 **Performance Optimizations**

### **Indexes Created**
- **Accounts**: 6 indexes for optimal query performance
- **Transactions**: 12 indexes for complex query patterns
- **Composite indexes** for date range queries
- **Specialized indexes** for Teller API integration

### **Query Optimization**
- Efficient date range queries
- Optimized for common access patterns
- Support for complex analytics queries

## 🔄 **Teller API Integration Ready**

### **Account Integration**
- `teller_account_id`: Links to Teller's account identifier
- `teller_institution_id`: Links to Teller's institution identifier
- `sync_status`: Tracks synchronization state
- `last_sync`: Timestamp of last successful sync

### **Transaction Integration**
- `teller_transaction_id`: Links to Teller's transaction identifier
- `teller_category`: Original category from Teller
- `teller_merchant`: Original merchant from Teller
- `teller_location`: Location data from Teller

## 🎯 **Next Steps**

After applying this migration:

1. **Create Controllers**
   - Account management controllers
   - Transaction management controllers

2. **Implement Teller API Integration**
   - Account linking functionality
   - Transaction synchronization

3. **Add Categorization System**
   - Categories table migration
   - Category management

4. **Create Analytics Queries**
   - Spending analysis
   - Budget tracking
   - Financial reporting

## ⚠️ **Important Notes**

- **Backup**: Always backup your database before running migrations
- **Testing**: Test the migration in a development environment first
- **Dependencies**: This migration depends on the `auth.users` table existing
- **Future Tables**: Categories and subcategories tables will be created separately

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Permission Errors**: Ensure you're using the service role key
2. **Foreign Key Errors**: Verify the `auth.users` table exists
3. **RLS Policy Errors**: Check that RLS is enabled on the tables

### **Rollback**
To rollback this migration:
```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS ensure_single_primary_account() CASCADE;
DROP FUNCTION IF EXISTS validate_transaction_amount() CASCADE;
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;
```

## 📞 **Support**

If you encounter issues with this migration:
1. Check the Supabase logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure you have the necessary permissions in your Supabase project 