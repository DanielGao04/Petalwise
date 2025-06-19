-- Fix RLS policies for flower_knowledge table
-- Run this in your Supabase SQL Editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'flower_knowledge';

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read flower knowledge" ON flower_knowledge;
DROP POLICY IF EXISTS "Allow service role to manage flower knowledge" ON flower_knowledge;

-- Create a simple policy that allows authenticated users to do everything
CREATE POLICY "Allow authenticated users to manage flower knowledge" ON flower_knowledge
    FOR ALL USING (auth.role() = 'authenticated');

-- Verify the new policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'flower_knowledge';

-- Test if we can insert data (this should work now)
INSERT INTO flower_knowledge (
    flower_type, 
    variety, 
    care_requirements, 
    optimal_temperature, 
    optimal_humidity, 
    water_requirements, 
    ethylene_sensitivity, 
    common_issues, 
    vase_life_tips, 
    source_url, 
    source_name
) VALUES (
    'Test Flower',
    'Test Variety',
    'Test care requirements',
    '65-75°F',
    '60-70%',
    'Clean water',
    'Low',
    'Test issues',
    'Test tips',
    'https://test.com',
    'Test Source'
) ON CONFLICT DO NOTHING;

-- Clean up test data
DELETE FROM flower_knowledge WHERE flower_type = 'Test Flower';

-- Show success message
SELECT 'RLS policies fixed successfully! You can now initialize the RAG system.' as status; 