import { FlowerBatch } from '@/types/database';
import { aiService, FlowerData, FlowerLifespan } from './aiService';

export type { FlowerLifespan } from './aiService';

export const getFlowerAnalysis = async (
  purchaseDate: string,
  expectedShelfLife: number,
  shelfLifeUnit: string,
  initialCondition: string,
  storageEnvironment: string,
  floralFoodUsed: boolean,
  vaseCleanliness: string
): Promise<FlowerLifespan> => {
  const flowerData: FlowerData = {
    purchaseDate,
    expectedShelfLife,
    shelfLifeUnit,
    initialCondition,
    storageEnvironment,
    floralFoodUsed,
    vaseCleanliness
  };

  return await aiService.predictFlowerLifespan(flowerData);
};

export const calculateDynamicSpoilageDate = async (
  purchaseDate: string,
  expectedShelfLife: number,
  shelfLifeUnit: string,
  initialCondition: string,
  storageEnvironment: string,
  floralFoodUsed: boolean,
  vaseCleanliness: string
): Promise<string> => {
  const analysis = await getFlowerAnalysis(
    purchaseDate,
    expectedShelfLife,
    shelfLifeUnit,
    initialCondition,
    storageEnvironment,
    floralFoodUsed,
    vaseCleanliness
  );

  // Calculate the spoilage date based on the AI's prediction
  const purchase = new Date(purchaseDate);
  const spoilageDate = new Date(purchase);
  spoilageDate.setDate(purchase.getDate() + analysis.daysRemaining);

  // Ensure minimum shelf life of 1 day
  const now = new Date();
  if (spoilageDate <= now) {
    spoilageDate.setDate(now.getDate() + 1);
  }

  return spoilageDate.toISOString();
};

export const getSpoilageStatus = (spoilageDate: string): FlowerLifespan => {
  const now = new Date();
  const spoilage = new Date(spoilageDate);
  const timeRemaining = spoilage.getTime() - now.getTime();
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let status: 'critical' | 'warning' | 'good';
  let color: string;
  let recommendation: string;
  let discountSuggestion: string;

  if (daysRemaining <= 1) {
    status = 'critical';
    color = '#EF4444';
    recommendation = 'Immediate action required - consider flash sale';
    discountSuggestion = 'Apply 30-50% discount for immediate sale';
  } else if (daysRemaining <= 3) {
    status = 'warning';
    color = '#F59E0B';
    recommendation = 'Monitor closely and prepare for sale';
    discountSuggestion = 'Consider 10-20% discount to encourage sales';
  } else {
    status = 'good';
    color = '#22C55E';
    recommendation = 'Monitor condition regularly';
    discountSuggestion = 'Maintain optimal storage conditions';
  }

  return {
    lifespan: `${daysRemaining} days and ${hoursRemaining} hours remaining`,
    daysRemaining,
    status,
    recommendation,
    discountSuggestion,
    color
  };
};

export const formatTimeRemaining = (days: number): string => {
  if (days <= 0) {
    return 'Expired';
  }
  if (days === 1) {
    return '1 day';
  }
  return `${days} days`;
};