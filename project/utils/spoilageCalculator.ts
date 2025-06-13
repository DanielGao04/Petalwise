import { FlowerBatch } from '@/types/database';

export interface SpoilageStatus {
  daysRemaining: number;
  status: 'critical' | 'warning' | 'good';
  recommendation: string;
  discountSuggestion: string;
  color: string;
}

export const calculateDynamicSpoilageDate = (
  purchaseDate: string,
  expectedShelfLife: number,
  shelfLifeUnit: string,
  initialCondition: string,
  storageEnvironment: string,
  floralFoodUsed: boolean,
  vaseCleanliness: string
): string => {
  const purchaseDateObj = new Date(purchaseDate);
  
  // Convert shelf life to days
  let shelfLifeDays = expectedShelfLife;
  if (shelfLifeUnit === 'Weeks') {
    shelfLifeDays = expectedShelfLife * 7;
  }

  // Base spoilage date
  let adjustmentDays = 0;

  // Initial Condition adjustments
  switch (initialCondition) {
    case 'Excellent':
      adjustmentDays += 1;
      break;
    case 'Good':
      adjustmentDays += 0;
      break;
    case 'Fair':
      adjustmentDays -= 1;
      break;
    case 'Poor':
      adjustmentDays -= 2;
      break;
  }

  // Storage Environment adjustments
  switch (storageEnvironment) {
    case 'Refrigerated':
      adjustmentDays += 2;
      break;
    case 'Room Temperature':
      adjustmentDays -= 3;
      break;
    case 'Other':
      adjustmentDays += 0; // User defined or AI determined
      break;
  }

  // Floral Food adjustments
  if (floralFoodUsed) {
    adjustmentDays += 1;
  } else {
    adjustmentDays -= 1;
  }

  // Vase/Bucket Cleanliness adjustments
  switch (vaseCleanliness) {
    case 'Clean':
      adjustmentDays += 0.5;
      break;
    case 'Rinsed':
      adjustmentDays += 0;
      break;
    case 'Dirty':
      adjustmentDays -= 1;
      break;
  }

  // Calculate final spoilage date
  const totalDays = shelfLifeDays + adjustmentDays;
  const spoilageDate = new Date(purchaseDateObj);
  spoilageDate.setDate(spoilageDate.getDate() + Math.max(1, Math.round(totalDays)));

  return spoilageDate.toISOString();
};

export const getSpoilageStatus = (dynamicSpoilageDate: string): SpoilageStatus => {
  const now = new Date();
  const spoilageDate = new Date(dynamicSpoilageDate);
  const diffTime = spoilageDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 1) {
    return {
      daysRemaining,
      status: 'critical',
      recommendation: 'Discount immediately by 30-50%',
      discountSuggestion: 'Flash sale recommended - use today',
      color: '#EF4444', // Red
    };
  } else if (daysRemaining <= 3) {
    return {
      daysRemaining,
      status: 'warning',
      recommendation: 'Consider 10-20% discount',
      discountSuggestion: 'Promote on social media',
      color: '#F59E0B', // Amber
    };
  } else {
    return {
      daysRemaining,
      status: 'good',
      recommendation: 'Monitor condition regularly',
      discountSuggestion: 'Maintain optimal storage',
      color: '#22C55E', // Green
    };
  }
};

export const formatTimeRemaining = (daysRemaining: number): string => {
  if (daysRemaining <= 0) {
    return 'EXPIRED';
  } else if (daysRemaining === 1) {
    return '1 day';
  } else {
    return `${daysRemaining} days`;
  }
};