import OpenAI from 'openai';

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

// Validation rules for more accurate predictions
const VALIDATION_RULES = {
  initialCondition: {
    'Excellent': 1,
    'Good': 0,
    'Fair': -1,
    'Poor': -2
  } as const,
  storageEnvironment: {
    'Refrigerated': 2,
    'Room Temperature': -3,
    'Other': 0
  } as const,
  floralFood: {
    true: 1,
    false: -1
  } as const,
  vaseCleanliness: {
    'Clean': 0.5,
    'Rinsed': 0,
    'Dirty': -1
  } as const
};

export const aiService = {
  async predictFlowerLifespan(flowerData: FlowerData): Promise<FlowerLifespan> {
    try {
      const prompt = `Given the following flower data:
      Purchase Date: ${flowerData.purchaseDate}
      Expected Shelf Life: ${flowerData.expectedShelfLife} ${flowerData.shelfLifeUnit}
      Initial Condition: ${flowerData.initialCondition}
      Storage Environment: ${flowerData.storageEnvironment}
      Floral Food Used: ${flowerData.floralFoodUsed ? 'Yes' : 'No'}
      Vase Cleanliness: ${flowerData.vaseCleanliness}

      Please analyze this flower data and provide:
      1. Calculate the exact number of days remaining
      2. Determine the status (critical if ≤1 day, warning if ≤3 days, good if >3 days)
      3. Provide appropriate recommendations and discount suggestions
      
      Format the response as a JSON object with these keys:
      - lifespan: A detailed explanation of the factors affecting the lifespan
      - daysRemaining: The exact number of days remaining (as a number)
      - status: Either "critical", "warning", or "good"
      - recommendation: Specific recommendation based on the status
      - discountSuggestion: Appropriate discount strategy
      - color: Color code for the status (#EF4444 for critical, #F59E0B for warning, #22C55E for good)
      
      Consider these specific adjustments in your calculation:
      - Initial condition: ${VALIDATION_RULES.initialCondition[flowerData.initialCondition]} days
      - Storage environment: ${VALIDATION_RULES.storageEnvironment[flowerData.storageEnvironment]} days
      - Floral food: ${flowerData.floralFoodUsed ? VALIDATION_RULES.floralFood.true : VALIDATION_RULES.floralFood.false} days
      - Vase cleanliness: ${VALIDATION_RULES.vaseCleanliness[flowerData.vaseCleanliness]} days
      
      For recommendations:
      - Critical (≤1 day): Suggest immediate 30-50% discount and flash sale
      - Warning (≤3 days): Suggest 10-20% discount and social media promotion
      - Good (>3 days): Suggest regular monitoring and optimal storage`;

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
        
        // Validate and adjust the AI's prediction
        const baseDays = flowerData.expectedShelfLife * (flowerData.shelfLifeUnit === 'Weeks' ? 7 : 1);
        const adjustmentDays = 
          VALIDATION_RULES.initialCondition[flowerData.initialCondition] +
          VALIDATION_RULES.storageEnvironment[flowerData.storageEnvironment] +
          (flowerData.floralFoodUsed ? VALIDATION_RULES.floralFood.true : VALIDATION_RULES.floralFood.false) +
          VALIDATION_RULES.vaseCleanliness[flowerData.vaseCleanliness];
        
        const validatedDaysRemaining = Math.max(1, Math.round(baseDays + adjustmentDays));
        
        // Ensure the AI's prediction is within reasonable bounds of our validated calculation
        const aiDaysRemaining = parsedResponse.daysRemaining || 0;
        const finalDaysRemaining = Math.abs(aiDaysRemaining - validatedDaysRemaining) > 3 
          ? validatedDaysRemaining 
          : aiDaysRemaining;

        // Determine status based on validated days
        const status = finalDaysRemaining <= 1 ? 'critical' 
          : finalDaysRemaining <= 3 ? 'warning' 
          : 'good';

        return {
          lifespan: parsedResponse.lifespan || 'Lifespan information not available',
          daysRemaining: finalDaysRemaining,
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
  }
}; 