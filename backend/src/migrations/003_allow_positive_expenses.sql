-- Migration: allow_positive_expenses
-- Description: Allow expenses to be stored as positive values instead of requiring negative amounts
-- Created: 2025-07-30
-- Author: Claude Code

-- Update the transaction amount validation function to allow positive expense amounts
CREATE OR REPLACE FUNCTION validate_transaction_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure income transactions have positive amounts
    IF NEW.type = 'income' AND NEW.amount < 0 THEN
        RAISE EXCEPTION 'Income transactions must have positive amounts';
    END IF;
    
    -- Allow expense transactions to have positive amounts (removed negative requirement)
    -- Expenses can now be stored as positive values for better UX
    IF NEW.type = 'expense' AND NEW.amount < 0 THEN
        -- Convert negative amounts to positive for consistency
        NEW.amount = ABS(NEW.amount);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update the account balance trigger to handle positive expense amounts correctly
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
        -- For expenses, subtract the amount (since they're now stored as positive)
        -- For income, add the amount
        -- For transfers, add the amount (can be positive or negative)
        IF NEW.type = 'expense' THEN
            UPDATE accounts 
            SET balance = balance - ABS(NEW.amount),
                updated_at = NOW()
            WHERE id = NEW.account_id;
        ELSE
            UPDATE accounts 
            SET balance = balance + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        DECLARE
            old_balance_effect DECIMAL(15,2);
            new_balance_effect DECIMAL(15,2);
        BEGIN
            -- Calculate the old balance effect
            IF OLD.type = 'expense' THEN
                old_balance_effect = -ABS(OLD.amount);
            ELSE
                old_balance_effect = OLD.amount;
            END IF;
            
            -- Calculate the new balance effect
            IF NEW.type = 'expense' THEN
                new_balance_effect = -ABS(NEW.amount);
            ELSE
                new_balance_effect = NEW.amount;
            END IF;
            
            -- If account changed, update both old and new accounts
            IF OLD.account_id != NEW.account_id THEN
                UPDATE accounts 
                SET balance = balance - old_balance_effect,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
                
                UPDATE accounts 
                SET balance = balance + new_balance_effect,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            ELSE
                -- Same account, just update the difference
                UPDATE accounts 
                SET balance = balance - old_balance_effect + new_balance_effect,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            END IF;
        END;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- For expenses, add back the amount (since they reduce balance when stored as positive)
        -- For income, subtract the amount
        IF OLD.type = 'expense' THEN
            UPDATE accounts 
            SET balance = balance + ABS(OLD.amount),
                updated_at = NOW()
            WHERE id = OLD.account_id;
        ELSE
            UPDATE accounts 
            SET balance = balance - OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Add comment explaining the change
COMMENT ON FUNCTION validate_transaction_amount() IS 'Updated to allow expense transactions to be stored as positive values for better UX';
COMMENT ON FUNCTION update_account_balance() IS 'Updated to handle positive expense amounts correctly in balance calculations';