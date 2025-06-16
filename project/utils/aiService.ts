import OpenAI from 'openai';
import { FlowerBatch } from '@/types/database';

// Initialize OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export interface FlowerLifespan {
  lifespan: string;
  daysRemaining: number;
  status: 'critical' | 'warning' | 'good';
  recommendation: string;
  discountSuggestion: string;
  color: string;
  error?: string;
}

export interface FlowerData {
  purchaseDate: string;
  expectedShelfLife: number;
  shelfLifeUnit: string;
  initialCondition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  storageEnvironment: 'Refrigerated' | 'Room Temperature' | 'Other';
  floralFoodUsed: boolean;
  vaseCleanliness: 'Clean' | 'Rinsed' | 'Dirty';
}

export const aiService = {
  async predictFlowerLifespan(flowerData: FlowerData): Promise<FlowerLifespan> {
    try {
      const prompt = `Given the following flower data, determine its remaining lifespan, assess its status, and provide appropriate recommendations and discount suggestions. The current date for all considerations is **June 15, 2025**.

Flower Data:
- Purchase Date: ${flowerData.purchaseDate} (YYYY-MM-DD format)
- Expected Shelf Life: ${flowerData.expectedShelfLife} ${flowerData.shelfLifeUnit} (e.g., "7 days", "2 weeks", "1 month")
- Initial Condition: ${flowerData.initialCondition} (e.g., "Excellent", "Good", "Fair", "Poor")
- Storage Environment: ${flowerData.storageEnvironment} (e.g., "Refrigerated", "Room Temperature", "Other")
- Floral Food Used: ${flowerData.floralFoodUsed ? 'Yes' : 'No'}
- Vase Cleanliness: ${flowerData.vaseCleanliness} (e.g., "Clean", "Rinsed", "Dirty")

Instructions for Lifespan Determination:
Based on your general knowledge of floriculture, flower care, and the provided flower data, estimate the remaining lifespan in days. Consider how each factor (purchase date, expected shelf life, initial condition, storage environment, floral food use, and vase cleanliness) would naturally influence a flower's longevity.

Status Determination:
- Critical: If estimated daysRemaining is less than or equal to 1 day
- Warning: If estimated daysRemaining is greater than 1 day but less than or equal to 3 days
- Good: If estimated daysRemaining is greater than 3 days

Instructions for Recommendations and Discount Suggestions:
Based on the determined status and your understanding of best practices for flower care and retail, generate a specific recommendation and an appropriate discount strategy. These should be dynamic and tailored to the situation, not based on predefined rules.

Output Format:
Provide the response as a JSON object with the following keys:
- lifespan: A detailed explanation of the factors affecting the lifespan and how the final daysRemaining was estimated based on your general knowledge
- daysRemaining: The estimated number of days remaining (as a number, can be a float)
- status: Either "critical", "warning", or "good"
- recommendation: Specific recommendation based on the determined status, dynamically generated
- discountSuggestion: Appropriate discount strategy based on the determined status, dynamically generated
- color: Color code for the status:
  - "#EF4444" for critical
  - "#F59E0B" for warning
  - "#22C55E" for good`; 

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a flower expert assistant that helps predict flower lifespan and provides recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseText = response.choices[0]?.message?.content?.trim() || '';
      
      try {
        const parsedResponse = JSON.parse(responseText);
        
        // Use the AI's prediction directly
        const daysRemaining = parsedResponse.daysRemaining || 0;
        const status = daysRemaining <= 1 ? 'critical' 
          : daysRemaining <= 3 ? 'warning' 
          : 'good';

        return {
          lifespan: parsedResponse.lifespan || 'Lifespan information not available',
          daysRemaining,
          status,
          recommendation: parsedResponse.recommendation || 'Monitor condition regularly',
          discountSuggestion: parsedResponse.discountSuggestion || 'Maintain optimal storage',
          color: status === 'critical' ? '#EF4444' 
            : status === 'warning' ? '#F59E0B' 
            : '#22C55E'
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return {
          lifespan: 'Error processing lifespan information',
          daysRemaining: 0,
          status: 'good',
          recommendation: 'Error processing data',
          discountSuggestion: 'Please check the data',
          color: '#22C55E'
        };
      }
    } catch (error) {
      console.error('AI API Error:', error);
      return {
        lifespan: 'Failed to determine lifespan',
        daysRemaining: 0,
        status: 'good',
        recommendation: 'Error processing data',
        discountSuggestion: 'Please check the data',
        color: '#22C55E',
        error: 'API request failed'
      };
    }
  },

  async getAISpoilagePrediction(batch: FlowerBatch) {
    try {
      const prompt = `Given the following flower batch information, predict the remaining lifespan and provide recommendations:

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
Dynamic Spoilage Date: ${batch.dynamic_spoilage_date}

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

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a flower expert AI assistant. Provide accurate predictions and practical recommendations for flower lifespan and sales strategies. Always return recommendations as an array of specific, actionable items. Be precise with time predictions, considering factors like storage conditions, initial quality, and care practices."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      const result = JSON.parse(response);
      
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
          days: result.prediction.days,
          hours: result.prediction.hours,
          minutes: result.prediction.minutes,
          totalHours: result.prediction.totalHours
        }
      };
    } catch (error) {
      console.error('Error getting AI prediction:', error);
      throw error;
    }
  }
};

export const { getAISpoilagePrediction } = aiService; 