-- Drop the existing strict constraint
ALTER TABLE item_table DROP CONSTRAINT IF EXISTS item_table_status_check;

-- Add the new constraint including 'awaiting_customer'
ALTER TABLE item_table 
ADD CONSTRAINT item_table_status_check 
CHECK (status IN ('pending', 'found', 'not_found', 'replaced', 'awaiting_customer'));
