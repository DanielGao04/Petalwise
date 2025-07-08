-- Add financial recommendations column to flower_batches table
ALTER TABLE flower_batches 
ADD COLUMN ai_financial_recommendations JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN flower_batches.ai_financial_recommendations IS 'Stores AI-generated financial recommendations including pricing strategies, discounts, and action items';

-- Update RLS policies to include the new column
DROP POLICY IF EXISTS "Users can view their own flower batches" ON flower_batches;
CREATE POLICY "Users can view their own flower batches" ON flower_batches
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own flower batches" ON flower_batches;
CREATE POLICY "Users can insert their own flower batches" ON flower_batches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own flower batches" ON flower_batches;
CREATE POLICY "Users can update their own flower batches" ON flower_batches
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own flower batches" ON flower_batches;
CREATE POLICY "Users can delete their own flower batches" ON flower_batches
    FOR DELETE USING (auth.uid() = user_id); 