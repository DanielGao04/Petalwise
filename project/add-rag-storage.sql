-- Add ai_detailed_prediction column to flower_batches table for storing RAG context
-- This column will store JSON data including ragContext, sources, and detailedPrediction

ALTER TABLE flower_batches 
ADD COLUMN IF NOT EXISTS ai_detailed_prediction JSONB;

-- Add comment to document the column purpose
COMMENT ON COLUMN flower_batches.ai_detailed_prediction IS 'Stores enhanced AI prediction data including RAG context, sources, and detailed prediction information';

-- Create index for better performance when querying JSON data
CREATE INDEX IF NOT EXISTS idx_flower_batches_ai_detailed_prediction 
ON flower_batches USING GIN (ai_detailed_prediction);

-- Update RLS policies to allow access to the new column
-- (The existing policies should already cover this, but let's make sure)

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'flower_batches' 
AND column_name = 'ai_detailed_prediction'; 