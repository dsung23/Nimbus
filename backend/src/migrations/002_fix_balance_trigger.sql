-- Migration to prevent balance trigger from overriding Teller API balances
-- Created: 2025-01-30

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS update_account_balance_trigger ON transactions;
DROP FUNCTION IF EXISTS update_account_balance();

-- Create updated function that respects Teller API balances
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update balance if account doesn't have recent Teller sync (within 1 hour)
    -- This prevents overriding real balance data from Teller API
    IF EXISTS (
        SELECT 1 FROM accounts 
        WHERE id = COALESCE(NEW.account_id, OLD.account_id)
        AND last_sync IS NOT NULL 
        AND last_sync > NOW() - INTERVAL '1 hour'
        AND notes LIKE '%Teller API%'
    ) THEN
        -- Skip balance update for accounts with recent Teller sync
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE accounts 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- If account changed, update both old and new accounts
        IF OLD.account_id != NEW.account_id THEN
            UPDATE accounts 
            SET balance = balance - OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.account_id;
            
            UPDATE accounts 
            SET balance = balance + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.account_id;
        ELSE
            -- Same account, update the difference
            UPDATE accounts 
            SET balance = balance - OLD.amount + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE accounts 
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Add comment explaining the change
COMMENT ON FUNCTION update_account_balance() IS 'Updated to respect Teller API balance data and not override recent syncs';