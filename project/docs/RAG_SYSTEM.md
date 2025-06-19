# RAG System Implementation for Petalwise

## Overview

This document describes the Retrieval-Augmented Generation (RAG) system implemented in Petalwise to enhance flower spoilage predictions and recommendations with expert knowledge.

## Architecture

### Components

1. **RAG Service** (`utils/ragService.ts`)
   - Handles knowledge base retrieval and context generation
   - Manages embeddings and semantic search
   - Creates enhanced prompts with retrieved context

2. **Enhanced AI Service** (`utils/enhancedAiService.ts`)
   - Integrates RAG with existing AI functionality
   - Provides fallback mechanisms
   - Returns enhanced predictions with sources

3. **Knowledge Manager** (`utils/knowledgeManager.ts`)
   - Manages flower care knowledge database
   - Handles CRUD operations for knowledge entries
   - Generates embeddings for new entries

4. **Database Schema** (`supabase/migrations/20250614000000_flower_knowledge.sql`)
   - Flower knowledge table with vector support
   - Vector similarity search functions
   - Proper indexing for performance

## How It Works

### 1. Knowledge Base Construction

The system stores flower care information in a structured format:

```typescript
interface FlowerKnowledge {
  flower_type: string;
  variety?: string;
  care_requirements: string;
  optimal_temperature: string;
  optimal_humidity: string;
  water_requirements: string;
  ethylene_sensitivity: string;
  common_issues: string;
  vase_life_tips: string;
  source_url: string;
  source_name: string;
  embedding: number[]; // Vector representation
}
```

### 2. Retrieval Process

When a prediction is requested:

1. **Query Formation**: Creates a search query from flower type, variety, and context
2. **Embedding Generation**: Converts query to vector using OpenAI embeddings
3. **Semantic Search**: Finds most relevant knowledge using vector similarity
4. **Context Assembly**: Combines retrieved information into structured context

### 3. Generation Process

1. **Enhanced Prompt Creation**: Combines retrieved context with batch information
2. **AI Prediction**: Sends enhanced prompt to GPT-3.5-turbo
3. **Response Processing**: Parses and structures the AI response
4. **Source Attribution**: Includes source information for transparency

## Usage

### Basic Usage

```typescript
import { getEnhancedSpoilagePrediction } from '@/utils/enhancedAiService';

const prediction = await getEnhancedSpoilagePrediction(flowerBatch);
```

### Adding Knowledge

```typescript
import { knowledgeManager } from '@/utils/knowledgeManager';

await knowledgeManager.addFlowerKnowledge({
  flower_type: 'Rose',
  variety: 'Red Naomi',
  care_requirements: 'Roses require clean water, floral food, and regular stem recutting.',
  optimal_temperature: '33-35°F (1-2°C)',
  optimal_humidity: '85-90%',
  water_requirements: 'Clean, room temperature water with floral food.',
  ethylene_sensitivity: 'High - keep away from ripening fruits',
  common_issues: 'Bent neck, petal bruising, bacterial growth in water',
  vase_life_tips: 'Recut stems at 45-degree angle, remove lower leaves',
  source_url: 'https://example.com/rose-care',
  source_name: 'Florist Expert Guide'
});
```

### Managing Knowledge Base

```typescript
// Get all knowledge
const allKnowledge = await knowledgeManager.getAllFlowerKnowledge();

// Search by flower type
const roseKnowledge = await knowledgeManager.searchFlowerKnowledge('Rose');

// Get statistics
const stats = await knowledgeManager.getKnowledgeBaseStats();
```

## Knowledge Sources

### Current Sources

The system includes sample data for common flowers:
- Roses (Red Naomi variety)
- Tulips (Standard variety)
- Lilies (Oriental variety)
- Carnations (Standard variety)
- Gerberas (Daisy variety)

### Adding New Sources

To add new flower care information:

1. **Identify Reputable Sources**:
   - University extension services
   - Florist association websites
   - Academic research papers
   - Professional flower care guides

2. **Extract Structured Information**:
   - Care requirements
   - Optimal conditions
   - Common issues
   - Vase life tips

3. **Add to Knowledge Base**:
   - Use the knowledge manager
   - Ensure proper source attribution
   - Generate embeddings automatically

## Performance Considerations

### Vector Search Optimization

- Uses pgvector extension for efficient similarity search
- IVFFlat index for approximate nearest neighbor search
- Configurable similarity thresholds (default: 0.7)

### Rate Limiting

- Embedding generation includes delays to respect API limits
- Batch operations are throttled appropriately
- Fallback mechanisms for API failures

### Caching

- Stored predictions are cached in the database
- RAG context is generated fresh for each request
- Consider implementing Redis for frequently accessed knowledge

## Error Handling

### Fallback Mechanisms

1. **Vector Search Failure**: Falls back to text-based search
2. **RAG System Failure**: Falls back to basic AI prediction
3. **API Failures**: Uses rule-based predictions
4. **Database Issues**: Continues with available data

### Monitoring

- Log all RAG operations for debugging
- Track prediction accuracy improvements
- Monitor API usage and costs

## Deployment

### Prerequisites

1. **Supabase Setup**:
   - Enable pgvector extension
   - Run the migration script
   - Configure proper RLS policies

2. **OpenAI API**:
   - Valid API key with embedding access
   - Sufficient quota for embeddings and completions

3. **Environment Variables**:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   ```

### Migration Steps

1. Run the database migration:
   ```sql
   -- Execute the migration file
   -- This creates the flower_knowledge table and functions
   ```

2. Initialize the knowledge base:
   ```typescript
   import { enhancedAiService } from '@/utils/enhancedAiService';
   await enhancedAiService.initializeRAG();
   ```

3. Test the system:
   ```typescript
   // Test with a sample flower batch
   const testBatch = { /* flower batch data */ };
   const prediction = await getEnhancedSpoilagePrediction(testBatch);
   ```

## Maintenance

### Regular Tasks

1. **Update Knowledge Base**:
   - Add new flower varieties
   - Update care information
   - Remove outdated sources

2. **Monitor Performance**:
   - Track prediction accuracy
   - Monitor API usage
   - Check database performance

3. **Regenerate Embeddings**:
   - When embedding model changes
   - When knowledge base structure updates
   - For consistency improvements

### Adding New Flower Types

1. Research the flower's care requirements
2. Find reputable sources
3. Structure the information
4. Add to knowledge base using the manager
5. Test predictions for the new flower type

## Future Enhancements

### Potential Improvements

1. **Multi-Modal RAG**:
   - Include image-based flower identification
   - Visual condition assessment
   - Photo-based care recommendations

2. **Dynamic Knowledge Updates**:
   - Web scraping for latest care information
   - User-generated knowledge contributions
   - Seasonal care adjustments

3. **Advanced Retrieval**:
   - Hybrid search (keyword + semantic)
   - Contextual relevance scoring
   - Multi-hop reasoning

4. **Personalization**:
   - User-specific care preferences
   - Local climate considerations
   - Historical prediction accuracy

### Scaling Considerations

1. **Database Optimization**:
   - Partitioning for large knowledge bases
   - Read replicas for search performance
   - Efficient embedding storage

2. **API Management**:
   - Embedding caching strategies
   - Batch processing for bulk operations
   - Cost optimization techniques

## Troubleshooting

### Common Issues

1. **Vector Search Not Working**:
   - Check pgvector extension installation
   - Verify embedding dimensions match
   - Ensure proper indexing

2. **API Rate Limits**:
   - Implement exponential backoff
   - Use caching for repeated queries
   - Monitor usage patterns

3. **Poor Retrieval Quality**:
   - Adjust similarity thresholds
   - Improve knowledge base quality
   - Review embedding generation

### Debug Tools

```typescript
// Test RAG retrieval directly
import { ragService } from '@/utils/ragService';
const context = await ragService.retrieveContext('Rose', 'Red Naomi');

// Check knowledge base
import { knowledgeManager } from '@/utils/knowledgeManager';
const stats = await knowledgeManager.getKnowledgeBaseStats();
```

## Conclusion

The RAG system significantly enhances Petalwise's AI capabilities by providing access to expert flower care knowledge. This leads to more accurate predictions and more relevant recommendations, ultimately improving the user experience and flower care outcomes.

The system is designed to be scalable, maintainable, and extensible, allowing for future enhancements and improvements as the application grows. 