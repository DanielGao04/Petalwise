# RAG System for Petalwise 🌸

This document provides a quick overview of the RAG (Retrieval-Augmented Generation) system implemented in Petalwise to enhance flower spoilage predictions with expert knowledge.

## What is RAG?

RAG combines the power of large language models with external knowledge retrieval to provide more accurate and informed predictions. In Petalwise, this means:

- **More Accurate Predictions**: AI predictions are enhanced with expert flower care knowledge
- **Better Recommendations**: Suggestions are based on specific flower types and care requirements
- **Source Attribution**: Users can see where the expert information comes from
- **Transparency**: Clear explanation of why certain recommendations are made

## Quick Start

### 1. Setup Prerequisites

Ensure you have:
- Supabase project with pgvector extension enabled
- OpenAI API key with embedding access
- Environment variable: `EXPO_PUBLIC_OPENAI_API_KEY`

### 2. Run Database Migration

Execute the migration file to create the knowledge base:
```sql
-- Run: supabase/migrations/20250614000000_flower_knowledge.sql
```

### 3. Initialize the System

```typescript
import { initializeRAGSystem } from '@/utils/initializeRAG';

// Initialize with sample data
await initializeRAGSystem();
```

### 4. Use Enhanced AI

```typescript
import { getEnhancedSpoilagePrediction } from '@/utils/enhancedAiService';

// Get enhanced prediction with RAG
const prediction = await getEnhancedSpoilagePrediction(flowerBatch);
```

## What's New in the UI

The AI recommendation screen now shows:

1. **Enhanced Predictions**: More accurate lifespan predictions
2. **Expert Care Information**: Specific care requirements for the flower type
3. **Source Attribution**: Links to expert sources
4. **Detailed Recommendations**: Actionable advice based on expert knowledge

## Supported Flowers

The system includes expert knowledge for:

- **Roses** (Red Naomi variety)
- **Tulips** (Standard variety)
- **Lilies** (Oriental variety)
- **Carnations** (Standard variety)
- **Gerberas** (Daisy variety)
- **Sunflowers** (Giant variety)
- **Orchids** (Phalaenopsis variety)
- **Peonies** (Garden variety)
- **Hydrangeas** (Mophead variety)
- **Daffodils** (Trumpet variety)

## Adding New Flowers

To add knowledge for a new flower type:

```typescript
import { knowledgeManager } from '@/utils/knowledgeManager';

await knowledgeManager.addFlowerKnowledge({
  flower_type: 'New Flower',
  variety: 'Specific Variety',
  care_requirements: 'Detailed care instructions...',
  optimal_temperature: '60-70°F (16-21°C)',
  optimal_humidity: '70-80%',
  water_requirements: 'Water care instructions...',
  ethylene_sensitivity: 'High/Medium/Low',
  common_issues: 'Common problems and solutions...',
  vase_life_tips: 'Tips for extending vase life...',
  source_url: 'https://reputable-source.com',
  source_name: 'Source Name'
});
```

## Testing the System

Test RAG functionality for any flower:

```typescript
import { testRAGFunctionality } from '@/utils/initializeRAG';

// Test with a specific flower
await testRAGFunctionality('Rose', 'Red Naomi');
```

## System Architecture

```
User Request → RAG Service → Knowledge Base → Enhanced AI → Response
     ↓              ↓              ↓              ↓          ↓
Flower Batch → Embedding → Vector Search → Context → Prediction
```

## Key Benefits

1. **Accuracy**: Predictions based on expert knowledge, not just general AI
2. **Specificity**: Recommendations tailored to specific flower types
3. **Transparency**: Users can see the sources of expert information
4. **Reliability**: Fallback mechanisms ensure the system always works
5. **Scalability**: Easy to add new flower types and knowledge

## Performance Notes

- **Vector Search**: Uses pgvector for efficient similarity search
- **Caching**: Predictions are cached to avoid repeated API calls
- **Fallbacks**: Multiple fallback mechanisms ensure reliability
- **Rate Limiting**: Built-in delays to respect API limits

## Troubleshooting

### Common Issues

1. **"Vector search failed"**: Check pgvector extension installation
2. **"No RAG context found"**: Verify knowledge base has data for the flower type
3. **"API rate limit"**: System will automatically retry with delays

### Debug Commands

```typescript
// Check knowledge base
import { knowledgeManager } from '@/utils/knowledgeManager';
const stats = await knowledgeManager.getKnowledgeBaseStats();

// Test RAG retrieval
import { ragService } from '@/utils/ragService';
const context = await ragService.retrieveContext('Rose', 'Red Naomi');
```

## Future Enhancements

- **Image Recognition**: Visual flower identification
- **Seasonal Adjustments**: Weather-based care recommendations
- **User Feedback**: Learning from user experiences
- **Multi-language Support**: Care information in multiple languages

## Support

For issues or questions about the RAG system:
1. Check the comprehensive documentation in `docs/RAG_SYSTEM.md`
2. Review the troubleshooting section above
3. Test with the provided debug tools

---

**The RAG system transforms Petalwise from a basic prediction tool into an expert flower care assistant, providing users with professional-grade recommendations backed by authoritative sources.** 🌺✨ 