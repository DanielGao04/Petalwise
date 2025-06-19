import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

// Initialize OpenAI for embeddings
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export interface FlowerKnowledge {
  id: string;
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
  created_at: string;
}

export interface RetrievedContext {
  flower_type: string;
  variety?: string;
  care_requirements: string;
  optimal_conditions: string;
  common_issues: string;
  vase_life_tips: string;
  sources: Array<{
    name: string;
    url: string;
  }>;
  relevance_score: number;
}

export interface RAGResponse {
  context: RetrievedContext[];
  enhanced_prompt: string;
  sources: Array<{
    name: string;
    url: string;
  }>;
}

class RAGService {
  private embeddingModel = 'text-embedding-3-small';
  private maxTokens = 1500;

  /**
   * Generate embeddings for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Search for relevant flower care information using semantic search
   */
  private async searchKnowledgeBase(
    flowerType: string,
    variety?: string,
    additionalContext?: string
  ): Promise<FlowerKnowledge[]> {
    try {
      console.log(`🔍 RAG Search Debug:`);
      console.log(`  Searching for: "${flowerType}"`);
      console.log(`  Variety: "${variety || 'none'}"`);
      console.log(`  Additional context: "${additionalContext || 'none'}"`);
      
      // First try vector search if embeddings exist
      try {
        const searchQuery = `${flowerType} ${variety || ''} care requirements optimal conditions vase life tips`.trim();
        console.log(`  Vector search query: "${searchQuery}"`);
        const queryEmbedding = await this.generateEmbedding(searchQuery);

        const { data, error } = await supabase
          .rpc('match_flower_knowledge', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5, // Lower threshold for better matches
            match_count: 5
          });

        if (!error && data && data.length > 0) {
          console.log(`  Vector search found ${data.length} results`);
          return data;
        } else {
          console.log(`  Vector search found 0 results (error: ${error?.message || 'none'})`);
        }
      } catch (vectorError) {
        console.warn('Vector search failed, using text search:', vectorError);
      }

      // Fallback to text search with correct field names
      console.log('Using text search fallback...');
      
      // Try multiple search strategies
      let searchResults: FlowerKnowledge[] = [];
      
      // Strategy 1: Exact flower type match
      console.log(`  Strategy 1: Exact match for "${flowerType}"`);
      const { data: exactData, error: exactError } = await supabase
        .from('flower_knowledge')
        .select('*')
        .eq('flower_type', flowerType)
        .limit(5);
      
      if (!exactError && exactData) {
        console.log(`    Found ${exactData.length} exact matches`);
        searchResults = searchResults.concat(exactData);
      } else {
        console.log(`    Exact match error: ${exactError?.message || 'none'}`);
      }
      
      // Strategy 2: Partial flower type match
      console.log(`  Strategy 2: Partial match for "${flowerType}"`);
      const { data: partialData, error: partialError } = await supabase
        .from('flower_knowledge')
        .select('*')
        .ilike('flower_type', `%${flowerType}%`)
        .limit(5);
      
      if (!partialError && partialData) {
        console.log(`    Found ${partialData.length} partial matches`);
        searchResults = searchResults.concat(partialData);
      } else {
        console.log(`    Partial match error: ${partialError?.message || 'none'}`);
      }
      
      // Strategy 3: Variety match if specified
      if (variety) {
        console.log(`  Strategy 3: Variety match for "${variety}"`);
        const { data: varietyData, error: varietyError } = await supabase
          .from('flower_knowledge')
          .select('*')
          .ilike('variety', `%${variety}%`)
          .limit(5);
        
        if (!varietyError && varietyData) {
          console.log(`    Found ${varietyData.length} variety matches`);
          searchResults = searchResults.concat(varietyData);
        } else {
          console.log(`    Variety match error: ${varietyError?.message || 'none'}`);
        }
      }
      
      // Strategy 4: Combined search (flower type + variety in one field)
      if (variety) {
        const combinedSearch = `${flowerType} ${variety}`;
        console.log(`  Strategy 4: Combined search for "${combinedSearch}"`);
        const { data: combinedData, error: combinedError } = await supabase
          .from('flower_knowledge')
          .select('*')
          .or(`flower_type.ilike.%${combinedSearch}%,variety.ilike.%${combinedSearch}%`)
          .limit(5);
        
        if (!combinedError && combinedData) {
          console.log(`    Found ${combinedData.length} combined matches`);
          searchResults = searchResults.concat(combinedData);
        } else {
          console.log(`    Combined match error: ${combinedError?.message || 'none'}`);
        }
      }
      
      // Strategy 5: Check what's actually in the database
      console.log(`  Strategy 5: Check all flower types in database`);
      const { data: allData, error: allError } = await supabase
        .from('flower_knowledge')
        .select('flower_type, variety')
        .limit(10);
      
      if (!allError && allData) {
        console.log(`    Database contains: ${allData.map(item => `${item.flower_type}${item.variety ? ` (${item.variety})` : ''}`).join(', ')}`);
      }
      
      // Remove duplicates based on id
      const uniqueResults = searchResults.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );

      console.log(`Text search found ${uniqueResults.length} unique results`);
      return uniqueResults;
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }

  /**
   * Retrieve relevant context for a flower batch
   */
  async retrieveContext(
    flowerType: string,
    variety?: string,
    storageEnvironment?: string,
    initialCondition?: string,
    floralFoodUsed?: boolean
  ): Promise<RAGResponse> {
    try {
      console.log(`🔍 RAG: Retrieving context for ${flowerType} ${variety || ''}`);
      
      // Build additional context for better retrieval
      const additionalContext = [
        storageEnvironment && `storage: ${storageEnvironment}`,
        initialCondition && `condition: ${initialCondition}`,
        floralFoodUsed !== undefined && `floral food: ${floralFoodUsed ? 'used' : 'not used'}`
      ].filter(Boolean).join(', ');

      // Search for relevant knowledge
      const knowledgeResults = await this.searchKnowledgeBase(
        flowerType,
        variety,
        additionalContext
      );

      console.log(`📊 RAG: Found ${knowledgeResults.length} knowledge results`);

      // Process and rank results
      const processedContext = knowledgeResults.map(knowledge => ({
        flower_type: knowledge.flower_type,
        variety: knowledge.variety,
        care_requirements: knowledge.care_requirements,
        optimal_conditions: `Temperature: ${knowledge.optimal_temperature}, Humidity: ${knowledge.optimal_humidity}, Water: ${knowledge.water_requirements}`,
        common_issues: knowledge.common_issues,
        vase_life_tips: knowledge.vase_life_tips,
        sources: [{
          name: knowledge.source_name,
          url: knowledge.source_url
        }],
        relevance_score: 0.8 // This could be enhanced with actual relevance scoring
      }));

      // Filter to only include relevant flower types and deduplicate sources
      const relevantContext = processedContext.filter(ctx => 
        ctx.flower_type.toLowerCase().includes(flowerType.toLowerCase()) ||
        (variety && ctx.variety && ctx.variety.toLowerCase().includes(variety.toLowerCase()))
      );

      console.log(`📊 RAG: Filtered to ${relevantContext.length} relevant results`);

      // Deduplicate sources based on name and URL
      const uniqueSources = relevantContext
        .flatMap(ctx => ctx.sources)
        .filter((source, index, self) => 
          index === self.findIndex(s => s.name === source.name && s.url === source.url)
        );

      console.log(`📊 RAG: Found ${uniqueSources.length} unique sources:`, uniqueSources.map(s => s.name));

      // Create enhanced prompt with retrieved context
      const enhancedPrompt = this.createEnhancedPrompt(relevantContext, {
        flowerType,
        variety,
        storageEnvironment,
        initialCondition,
        floralFoodUsed
      });

      console.log(`📝 RAG: Enhanced prompt length: ${enhancedPrompt.length} characters`);

      return {
        context: relevantContext,
        enhanced_prompt: enhancedPrompt,
        sources: uniqueSources
      };
    } catch (error) {
      console.error('❌ Error retrieving context:', error);
      return {
        context: [],
        enhanced_prompt: '',
        sources: []
      };
    }
  }

  /**
   * Create enhanced prompt with retrieved context
   */
  private createEnhancedPrompt(
    context: RetrievedContext[],
    batchInfo: {
      flowerType: string;
      variety?: string;
      storageEnvironment?: string;
      initialCondition?: string;
      floralFoodUsed?: boolean;
    }
  ): string {
    if (context.length === 0) {
      return '';
    }

    const contextSection = context.map(ctx => `
SPECIFIC CARE INFORMATION FOR ${ctx.flower_type.toUpperCase()}${ctx.variety ? ` (${ctx.variety})` : ''}:
- Care Requirements: ${ctx.care_requirements}
- Optimal Conditions: ${ctx.optimal_conditions}
- Common Issues: ${ctx.common_issues}
- Vase Life Tips: ${ctx.vase_life_tips}
- Source: ${ctx.sources[0]?.name || 'Unknown'}
`).join('\n');

    return `
IMPORTANT: Use the following expert flower care information to make more accurate predictions and provide specific, actionable recommendations.

${contextSection}

BATCH INFORMATION:
- Flower Type: ${batchInfo.flowerType}
- Variety: ${batchInfo.variety || 'Not specified'}
- Storage Environment: ${batchInfo.storageEnvironment || 'Not specified'}
- Initial Condition: ${batchInfo.initialCondition || 'Not specified'}
- Floral Food Used: ${batchInfo.floralFoodUsed ? 'Yes' : 'No'}

Based on the expert care information above, provide:
1. More precise spoilage predictions considering the specific care requirements
2. Detailed, actionable recommendations based on the flower's specific needs
3. Specific care tips that address the flower's unique characteristics
4. Any special considerations mentioned in the care information

Ensure your recommendations are specific to this flower type and variety, not generic advice.
`;
  }

  /**
   * Initialize knowledge base with sample data
   */
  async initializeKnowledgeBase(): Promise<void> {
    try {
      // Check if knowledge base already has data
      const { data: existingData } = await supabase
        .from('flower_knowledge')
        .select('id')
        .limit(1);

      if (existingData && existingData.length > 0) {
        console.log('Knowledge base already initialized');
        return;
      }

      // Sample knowledge data for common flowers
      const sampleKnowledge = [
        {
          flower_type: 'Rose',
          variety: 'Red Naomi',
          care_requirements: 'Roses require clean water, floral food, and regular stem recutting. Remove thorns and leaves below water line.',
          optimal_temperature: '33-35°F (1-2°C)',
          optimal_humidity: '85-90%',
          water_requirements: 'Clean, room temperature water with floral food. Change water every 2-3 days.',
          ethylene_sensitivity: 'High - keep away from ripening fruits',
          common_issues: 'Bent neck, petal bruising, bacterial growth in water',
          vase_life_tips: 'Recut stems at 45-degree angle, remove lower leaves, use anti-ethylene treatment',
          source_url: 'https://www.floristsreview.com/rose-care-guide',
          source_name: 'Florists Review'
        },
        {
          flower_type: 'Tulip',
          variety: 'Standard',
          care_requirements: 'Tulips continue growing after cutting. Use cold water and avoid direct sunlight.',
          optimal_temperature: '32-35°F (0-2°C)',
          optimal_humidity: '80-85%',
          water_requirements: 'Cold water, minimal floral food. Tulips prefer less food than other flowers.',
          ethylene_sensitivity: 'Low',
          common_issues: 'Excessive stem growth, drooping heads, color fading',
          vase_life_tips: 'Use cold water, avoid warm environments, minimal handling',
          source_url: 'https://www.flowercouncil.org/tulip-care',
          source_name: 'Flower Council'
        },
        {
          flower_type: 'Lily',
          variety: 'Oriental',
          care_requirements: 'Remove pollen to prevent staining. Lilies are sensitive to ethylene and require clean water.',
          optimal_temperature: '33-35°F (1-2°C)',
          optimal_humidity: '85-90%',
          water_requirements: 'Clean water with floral food. Remove pollen carefully.',
          ethylene_sensitivity: 'High - keep away from ripening fruits',
          common_issues: 'Pollen staining, petal drop, stem rot',
          vase_life_tips: 'Remove pollen carefully, use anti-ethylene treatment, avoid touching petals',
          source_url: 'https://www.lilycareguide.com',
          source_name: 'Lily Care Guide'
        },
        {
          flower_type: 'Carnation',
          variety: 'Standard',
          care_requirements: 'Carnations are ethylene sensitive and require clean water. They can last 2-3 weeks with proper care.',
          optimal_temperature: '33-35°F (1-2°C)',
          optimal_humidity: '80-85%',
          water_requirements: 'Clean water with floral food. Carnations are heavy drinkers.',
          ethylene_sensitivity: 'High - keep away from ripening fruits',
          common_issues: 'Wilting, color fading, stem breakage',
          vase_life_tips: 'Use anti-ethylene treatment, recut stems regularly, avoid warm temperatures',
          source_url: 'https://www.carnationcare.com',
          source_name: 'Carnation Care'
        },
        {
          flower_type: 'Gerbera',
          variety: 'Daisy',
          care_requirements: 'Gerberas are sensitive to bacteria and require very clean water. Avoid getting water on the flower head.',
          optimal_temperature: '33-35°F (1-2°C)',
          optimal_humidity: '80-85%',
          water_requirements: 'Very clean water with floral food. Change water daily.',
          ethylene_sensitivity: 'Medium',
          common_issues: 'Bent stems, bacterial growth, petal wilting',
          vase_life_tips: 'Use clean containers, avoid water on flower head, recut stems daily',
          source_url: 'https://www.gerberacare.org',
          source_name: 'Gerbera Care Association'
        }
      ];

      // Insert sample data
      for (const knowledge of sampleKnowledge) {
        const { error } = await supabase
          .from('flower_knowledge')
          .insert(knowledge);

        if (error) {
          console.error('Error inserting knowledge:', error);
        }
      }

      console.log('Knowledge base initialized with sample data');
    } catch (error) {
      console.error('Error initializing knowledge base:', error);
    }
  }
}

export const ragService = new RAGService(); 