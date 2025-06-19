-- Safe migration for flower_knowledge table
-- This script only creates what doesn't already exist

-- Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create flower_knowledge table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS flower_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flower_type TEXT NOT NULL,
    variety TEXT,
    care_requirements TEXT NOT NULL,
    optimal_temperature TEXT NOT NULL,
    optimal_humidity TEXT NOT NULL,
    water_requirements TEXT NOT NULL,
    ethylene_sensitivity TEXT NOT NULL,
    common_issues TEXT NOT NULL,
    vase_life_tips TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_name TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_flower_knowledge_flower_type ON flower_knowledge(flower_type);
CREATE INDEX IF NOT EXISTS idx_flower_knowledge_variety ON flower_knowledge(variety);
CREATE INDEX IF NOT EXISTS idx_flower_knowledge_embedding ON flower_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create function for vector similarity search (only if it doesn't exist)
CREATE OR REPLACE FUNCTION match_flower_knowledge(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    flower_type TEXT,
    variety TEXT,
    care_requirements TEXT,
    optimal_temperature TEXT,
    optimal_humidity TEXT,
    water_requirements TEXT,
    ethylene_sensitivity TEXT,
    common_issues TEXT,
    vase_life_tips TEXT,
    source_url TEXT,
    source_name TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fk.id,
        fk.flower_type,
        fk.variety,
        fk.care_requirements,
        fk.optimal_temperature,
        fk.optimal_humidity,
        fk.water_requirements,
        fk.ethylene_sensitivity,
        fk.common_issues,
        fk.vase_life_tips,
        fk.source_url,
        fk.source_name,
        1 - (fk.embedding <=> query_embedding) as similarity
    FROM flower_knowledge fk
    WHERE fk.embedding IS NOT NULL
    AND 1 - (fk.embedding <=> query_embedding) > match_threshold
    ORDER BY fk.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create trigger function (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_flower_knowledge_updated_at'
    ) THEN
        CREATE TRIGGER update_flower_knowledge_updated_at 
            BEFORE UPDATE ON flower_knowledge 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS (only if not already enabled)
ALTER TABLE flower_knowledge ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read flower knowledge" ON flower_knowledge;
DROP POLICY IF EXISTS "Allow service role to manage flower knowledge" ON flower_knowledge;

-- Create new policy that allows authenticated users to do everything
CREATE POLICY "Allow authenticated users to manage flower knowledge" ON flower_knowledge
    FOR ALL USING (auth.role() = 'authenticated');

-- Show success message
SELECT 'Safe migration completed successfully! The flower_knowledge table is ready for use.' as status; 