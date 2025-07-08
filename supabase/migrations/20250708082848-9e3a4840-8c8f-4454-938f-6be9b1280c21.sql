
-- Add order_index column to goals_data table to store custom task ordering
ALTER TABLE goals_data ADD COLUMN order_index INTEGER;

-- Create an index on order_index for better query performance
CREATE INDEX idx_goals_data_order_index ON goals_data(order_index);
