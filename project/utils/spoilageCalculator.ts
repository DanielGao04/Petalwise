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

export const getSpoilageStatus = (spoilageDate: string): FlowerLifespan => {
  const now = new Date();
  const spoilage = new Date(spoilageDate);
  const daysRemaining = Math.ceil((spoilage.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
    lifespan: `${daysRemaining} days remaining`,
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