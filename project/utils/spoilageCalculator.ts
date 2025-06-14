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