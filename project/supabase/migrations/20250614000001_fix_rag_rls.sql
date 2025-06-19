-- Fix RLS policies for flower_knowledge table
-- Allow authenticated users to insert data for initialization

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read flower knowledge" ON flower_knowledge;
DROP POLICY IF EXISTS "Allow service role to manage flower knowledge" ON flower_knowledge;

-- Create new policies that allow authenticated users to manage flower knowledge
CREATE POLICY "Allow authenticated users to manage flower knowledge" ON flower_knowledge
    FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: If you want more restrictive policies, use these instead:
-- CREATE POLICY "Allow authenticated users to read flower knowledge" ON flower_knowledge
--     FOR SELECT USING (auth.role() = 'authenticated');
-- 
-- CREATE POLICY "Allow authenticated users to insert flower knowledge" ON flower_knowledge
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- 
-- CREATE POLICY "Allow authenticated users to update flower knowledge" ON flower_knowledge
--     FOR UPDATE USING (auth.role() = 'authenticated');
-- 
-- CREATE POLICY "Allow authenticated users to delete flower knowledge" ON flower_knowledge
--     FOR DELETE USING (auth.role() = 'authenticated'); 