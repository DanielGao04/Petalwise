import OpenAI from 'openai';
import { FlowerBatch } from '@/types/database';
import { ragService, RAGResponse } from './ragService';

// Initialize OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export interface EnhancedPrediction {
  prediction: number;
  confidence: number;
  reasoning: string;
  recommendations: string[];
  detailedPrediction?: {
    days: number;
    hours: number;
    minutes: number;
    totalHours: number;
  };
  sources: Array<{
    name: string;
    url: string;
  }>;
  ragContext?: {
    flowerType: string;
    variety?: string;
    careRequirements: string;
    optimalConditions: string;
    commonIssues: string;
    vaseLifeTips: string;
  };
}

export interface EnhancedRecommendation {
  prediction: number;
  confidence: number;
  reasoning: string;
  recommendations: string[];
  detailedPrediction?: {
    days: number;
    hours: number;
    minutes: number;
    totalHours: number;
  };
  sources: Array<{
    name: string;
    url: string;
  }>;
  ragContext?: {
    flowerType: string;
    variety?: string;
    careRequirements: string;
    optimalConditions: string;
    commonIssues: string;
    vaseLifeTips: string;
  };
}

class EnhancedAIService {
  private model = 'gpt-3.5-turbo';
  private maxTokens = 800;
  private temperature = 0.7;

  /**
   * Get enhanced AI spoilage prediction using RAG
   */
  async getEnhancedSpoilagePrediction(batch: FlowerBatch): Promise<EnhancedPrediction> {
    try {
      // Step 1: Retrieve relevant context using RAG
      const ragResponse = await ragService.retrieveContext(
        batch.flower_type,
        batch.variety,
        batch.storage_environment,
        batch.initial_condition,
        batch.floral_food_used
      );

      // Step 2: Create enhanced prompt with RAG context
      const enhancedPrompt = this.createEnhancedPrompt(batch, ragResponse);

      // Step 3: Get AI prediction with enhanced context
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a flower expert AI assistant with access to specialized flower care knowledge. Provide accurate predictions and practical recommendations for flower lifespan and sales strategies. Always return recommendations as an array of specific, actionable items. Be precise with time predictions, considering factors like storage conditions, initial quality, and care practices. When you have access to specific flower care information, use it to make more accurate predictions and provide targeted recommendations."
          },
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      // Step 4: Parse and process the response
      const result = this.parseAIResponse(response);
      
      // Debug: Log RAG response details
      console.log('🔍 Enhanced AI Debug:');
      console.log(`  RAG context length: ${ragResponse.context.length}`);
      console.log(`  RAG sources length: ${ragResponse.sources.length}`);
      if (ragResponse.context.length > 0) {
        console.log(`  First context item:`, ragResponse.context[0]);
      }
      
      // Step 5: Return enhanced prediction with sources
      const enhancedPrediction = {
        prediction: result.prediction,
        confidence: result.confidence,
        reasoning: result.reasoning,
        recommendations: result.recommendations,
        detailedPrediction: result.detailedPrediction,
        sources: ragResponse.sources,
        ragContext: ragResponse.context.length > 0 ? {
          flowerType: ragResponse.context[0].flower_type,
          variety: ragResponse.context[0].variety,
          careRequirements: ragResponse.context[0].care_requirements,
          optimalConditions: ragResponse.context[0].optimal_conditions,
          commonIssues: ragResponse.context[0].common_issues,
          vaseLifeTips: ragResponse.context[0].vase_life_tips,
        } : undefined
      };
      
      console.log(`  Final ragContext:`, enhancedPrediction.ragContext);
      
      return enhancedPrediction;

    } catch (error) {
      console.error('Error getting enhanced AI prediction:', error);
      
      // Fallback to basic prediction if RAG fails
      return this.getFallbackPrediction(batch);
    }
  }

  /**
   * Create enhanced prompt with RAG context
   */
  private createEnhancedPrompt(batch: FlowerBatch, ragResponse: RAGResponse): string {
    const basePrompt = `Given the following flower batch information, predict the remaining lifespan and provide recommendations:

Flower Type: ${batch.flower_type}
Variety: ${batch.variety}
Quantity: ${batch.quantity} ${batch.unit_of_measure}
Supplier: ${batch.supplier}
Initial Condition: ${batch.initial_condition}
Storage Environment: ${batch.storage_environment}
Floral Food: ${batch.floral_food_used ? 'Yes' : 'No'}
Vase Cleanliness: ${batch.vase_cleanliness}
Water Type: ${batch.water_type}
Humidity Level: ${batch.humidity_level}
Current Date: ${new Date().toISOString()}
Dynamic Spoilage Date: ${batch.dynamic_spoilage_date}`;

    // Add RAG context if available
    if (ragResponse.enhanced_prompt) {
      return `${ragResponse.enhanced_prompt}\n\n${basePrompt}\n\nPlease provide a prediction in the following JSON format:
{
  "prediction": {
    "days": number of full days remaining,
    "hours": number of hours remaining (0-23),
    "minutes": number of minutes remaining (0-59),
    "totalHours": total hours remaining (including fractional hours)
  },
  "confidence": number between 0 and 1,
  "reasoning": "detailed explanation of the prediction incorporating the expert care information",
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"]
}

Note: The prediction should be precise down to the minute, and totalHours should be used for calculations. Use the expert care information to make more accurate predictions and provide specific, actionable recommendations.`;
    }

    // Fallback to basic prompt if no RAG context
    return `${basePrompt}

Please provide a prediction in the following JSON format:
{
  "prediction": {
    "days": number of full days remaining,
    "hours": number of hours remaining (0-23),
    "minutes": number of minutes remaining (0-59),
    "totalHours": total hours remaining (including fractional hours)
  },
  "confidence": number between 0 and 1,
  "reasoning": "detailed explanation of the prediction",
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"]
}

Note: The prediction should be precise down to the minute, and totalHours should be used for calculations.`;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: string): {
    prediction: number;
    confidence: number;
    reasoning: string;
    recommendations: string[];
    detailedPrediction?: {
      days: number;
      hours: number;
      minutes: number;
      totalHours: number;
    };
  } {
    try {
      // Clean the response - remove any markdown formatting and extract JSON
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to find JSON object in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        cleanedResponse = jsonMatch[0] as string;
      }
      
      console.log('🔍 Attempting to parse AI response:', cleanedResponse.substring(0, 200) + '...');
      
      const result = JSON.parse(cleanedResponse);
      
      // Validate the required fields
      if (!result.prediction || !result.prediction.totalHours) {
        throw new Error('Missing prediction data in AI response');
      }
      
      // Ensure recommendations is always an array
      if (!Array.isArray(result.recommendations)) {
        result.recommendations = [result.recommendations].filter(Boolean);
      }

      // Convert the prediction to total days for storage
      const totalDays = result.prediction.totalHours / 24;
      
      return {
        prediction: totalDays,
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning || 'Based on the provided data',
        recommendations: result.recommendations || ['Monitor condition regularly'],
        detailedPrediction: {
          days: result.prediction.days || 0,
          hours: result.prediction.hours || 0,
          minutes: result.prediction.minutes || 0,
          totalHours: result.prediction.totalHours
        }
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', response);
      
      // Try to extract basic information from the response even if JSON is malformed
      try {
        const fallbackResult = this.extractFallbackFromResponse(response);
        console.log('✅ Using fallback extraction:', fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
        throw new Error('Invalid AI response format');
      }
    }
  }

  /**
   * Extract basic information from malformed AI response
   */
  private extractFallbackFromResponse(response: string): {
    prediction: number;
    confidence: number;
    reasoning: string;
    recommendations: string[];
    detailedPrediction?: {
      days: number;
      hours: number;
      minutes: number;
      totalHours: number;
    };
  } {
    // Try to extract numbers that might be days/hours
    const numbers = response.match(/\d+(?:\.\d+)?/g) || [];
    const totalHours = numbers.length > 0 ? parseFloat(numbers[0]) * 24 : 48; // Default to 2 days
    
    // Try to extract reasoning (text between quotes or after "reasoning:")
    const reasoningMatch = response.match(/reasoning["\s]*:["\s]*([^"]+)/i) || 
                          response.match(/explanation["\s]*:["\s]*([^"]+)/i) ||
                          response.match(/because["\s]*([^"]+)/i);
    const reasoning = reasoningMatch && reasoningMatch[1] ? reasoningMatch[1].trim() : 'Based on the provided data';
    
    // Try to extract recommendations (lines starting with - or •)
    const recommendationMatches = response.match(/(?:[-•]\s*)([^\n]+)/g) || [];
    const recommendations = recommendationMatches.length > 0 
      ? recommendationMatches.map(r => r.replace(/^[-•]\s*/, '').trim())
      : ['Monitor condition regularly', 'Check water levels daily', 'Maintain proper temperature'];
    
    return {
      prediction: totalHours / 24,
      confidence: 0.7, // Lower confidence for fallback
      reasoning: reasoning,
      recommendations: recommendations,
      detailedPrediction: {
        days: Math.floor(totalHours / 24),
        hours: Math.floor(totalHours % 24),
        minutes: Math.floor((totalHours % 1) * 60),
        totalHours: totalHours
      }
    };
  }

  /**
   * Fallback prediction when RAG fails
   */
  private getFallbackPrediction(batch: FlowerBatch): EnhancedPrediction {
    // Simple rule-based fallback
    const baseDays = batch.expected_shelf_life;
    let adjustment = 0;

    // Adjust based on initial condition
    switch (batch.initial_condition) {
      case 'Excellent':
        adjustment += 1;
        break;
      case 'Good':
        adjustment += 0.5;
        break;
      case 'Fair':
        adjustment -= 0.5;
        break;
      case 'Poor':
        adjustment -= 1;
        break;
    }

    // Adjust based on storage environment
    if (batch.storage_environment === 'Refrigerated') {
      adjustment += 1;
    } else if (batch.storage_environment === 'Room Temperature') {
      adjustment -= 0.5;
    }

    // Adjust based on floral food usage
    if (batch.floral_food_used) {
      adjustment += 0.5;
    }

    const prediction = Math.max(0, baseDays + adjustment);

    return {
      prediction,
      confidence: 0.6,
      reasoning: `Fallback prediction based on expected shelf life (${baseDays} days) adjusted for initial condition (${batch.initial_condition}), storage environment (${batch.storage_environment}), and floral food usage (${batch.floral_food_used ? 'Yes' : 'No'}).`,
      recommendations: [
        'Monitor flower condition regularly',
        'Maintain optimal storage conditions',
        'Consider using floral food if not already used'
      ],
      sources: [],
      detailedPrediction: {
        days: Math.floor(prediction),
        hours: Math.floor((prediction - Math.floor(prediction)) * 24),
        minutes: Math.floor(((prediction - Math.floor(prediction)) * 24 - Math.floor((prediction - Math.floor(prediction)) * 24)) * 60),
        totalHours: prediction * 24
      }
    };
  }

  /**
   * Initialize the RAG system
   */
  async initializeRAG(): Promise<void> {
    try {
      await ragService.initializeKnowledgeBase();
      console.log('RAG system initialized successfully');
    } catch (error) {
      console.error('Error initializing RAG system:', error);
    }
  }
}

export const enhancedAiService = new EnhancedAIService(); 