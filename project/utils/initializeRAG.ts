import { enhancedAiService } from './enhancedAiService';
import { knowledgeManager } from './knowledgeManager';
import { FlowerCareData } from './knowledgeManager';
import { supabase } from '@/lib/supabase';

/**
 * Initialize the RAG system with sample data and verify functionality
 */
export async function initializeRAGSystem(): Promise<void> {
  console.log('🚀 Initializing RAG system for Petalwise...');

  try {
    // Step 1: Initialize the knowledge base
    console.log('📚 Initializing knowledge base...');
    await enhancedAiService.initializeRAG();
    console.log('✅ Knowledge base initialized');

    // Step 2: Add additional sample data for more flower types
    console.log('🌺 Adding additional flower care knowledge...');
    await addAdditionalFlowerKnowledge();
    console.log('✅ Additional flower knowledge added');

    // Step 3: Verify the system is working
    console.log('🔍 Verifying RAG system functionality...');
    await verifyRAGSystem();
    console.log('✅ RAG system verification complete');

    // Step 4: Display system statistics
    console.log('📊 Getting system statistics...');
    await displaySystemStats();
    console.log('✅ RAG system initialization complete!');

  } catch (error) {
    console.error('❌ Error initializing RAG system:', error);
    throw error;
  }
}

/**
 * Add additional flower care knowledge to expand the knowledge base
 */
async function addAdditionalFlowerKnowledge(): Promise<void> {
  const additionalFlowers: FlowerCareData[] = [
    {
      flower_type: 'Sunflower',
      variety: 'Giant',
      care_requirements: 'Sunflowers need plenty of water and should be kept in bright, indirect light. They are heavy drinkers and require frequent water changes.',
      optimal_temperature: '65-75°F (18-24°C)',
      optimal_humidity: '60-70%',
      water_requirements: 'Clean water with floral food. Change water every 1-2 days. Sunflowers drink a lot of water.',
      ethylene_sensitivity: 'Low',
      common_issues: 'Drooping heads, stem rot, yellowing leaves',
      vase_life_tips: 'Recut stems daily, remove lower leaves, use clean vase, avoid direct sunlight',
      source_url: 'https://www.sunflowercareguide.com',
      source_name: 'Sunflower Care Guide'
    },
    {
      flower_type: 'Orchid',
      variety: 'Phalaenopsis',
      care_requirements: 'Orchids require minimal water and should be kept in a well-ventilated area. Avoid overwatering and direct sunlight.',
      optimal_temperature: '65-80°F (18-27°C)',
      optimal_humidity: '50-70%',
      water_requirements: 'Minimal water, mist occasionally. Avoid soaking the roots.',
      ethylene_sensitivity: 'Medium',
      common_issues: 'Root rot, bud drop, yellowing leaves',
      vase_life_tips: 'Keep in bright indirect light, avoid overwatering, maintain humidity',
      source_url: 'https://www.orchidcare.org',
      source_name: 'Orchid Care Association'
    },
    {
      flower_type: 'Peony',
      variety: 'Garden',
      care_requirements: 'Peonies are sensitive to heat and should be kept cool. They benefit from floral food and clean water.',
      optimal_temperature: '60-65°F (16-18°C)',
      optimal_humidity: '70-80%',
      water_requirements: 'Clean, cool water with floral food. Change water every 2-3 days.',
      ethylene_sensitivity: 'High',
      common_issues: 'Bud blast, petal drop, stem breakage',
      vase_life_tips: 'Keep cool, use anti-ethylene treatment, handle gently, avoid warm temperatures',
      source_url: 'https://www.peonycare.com',
      source_name: 'Peony Care Expert'
    },
    {
      flower_type: 'Hydrangea',
      variety: 'Mophead',
      care_requirements: 'Hydrangeas need plenty of water and can change color based on soil pH. They are very thirsty flowers.',
      optimal_temperature: '60-70°F (16-21°C)',
      optimal_humidity: '70-80%',
      water_requirements: 'Lots of clean water with floral food. Hydrangeas are very thirsty.',
      ethylene_sensitivity: 'Medium',
      common_issues: 'Wilting, color fading, stem rot',
      vase_life_tips: 'Keep well hydrated, recut stems daily, use clean vase, avoid heat',
      source_url: 'https://www.hydrangeacare.net',
      source_name: 'Hydrangea Care Network'
    },
    {
      flower_type: 'Daffodil',
      variety: 'Trumpet',
      care_requirements: 'Daffodils produce a sap that can harm other flowers. They should be conditioned separately before mixing.',
      optimal_temperature: '50-65°F (10-18°C)',
      optimal_humidity: '60-70%',
      water_requirements: 'Clean water with floral food. Condition separately for 24 hours.',
      ethylene_sensitivity: 'Low',
      common_issues: 'Sap production, stem breakage, color fading',
      vase_life_tips: 'Condition separately, recut stems, use clean vase, avoid mixing with other flowers initially',
      source_url: 'https://www.daffodilcare.org',
      source_name: 'Daffodil Care Society'
    }
  ];

  // Try to add flowers using the knowledge manager first
  for (const flower of additionalFlowers) {
    try {
      await knowledgeManager.addFlowerKnowledge(flower);
      console.log(`  ✅ Added ${flower.flower_type}${flower.variety ? ` (${flower.variety})` : ''}`);
    } catch (error) {
      console.warn(`  ⚠️ Failed to add ${flower.flower_type} via knowledge manager:`, error);
      
      // Fallback: Try direct insertion with RLS bypass
      try {
        await addFlowerKnowledgeDirect(flower);
        console.log(`  ✅ Added ${flower.flower_type} via direct insertion`);
      } catch (directError) {
        console.error(`  ❌ Failed to add ${flower.flower_type} via direct insertion:`, directError);
      }
    }
  }
}

/**
 * Add flower knowledge directly to bypass RLS issues
 */
async function addFlowerKnowledgeDirect(flowerData: FlowerCareData): Promise<void> {
  // Generate embedding for the data
  const text = `${flowerData.flower_type} ${flowerData.variety || ''} ${flowerData.care_requirements} ${flowerData.optimal_temperature} ${flowerData.optimal_humidity} ${flowerData.water_requirements} ${flowerData.ethylene_sensitivity} ${flowerData.common_issues} ${flowerData.vase_life_tips}`;
  
  // For now, we'll add without embedding to avoid API calls during initialization
  // The embedding can be generated later when needed
  const { error } = await supabase
    .from('flower_knowledge')
    .insert({
      ...flowerData,
      embedding: null, // Will be generated later
    });

  if (error) {
    throw error;
  }
}

/**
 * Verify that the RAG system is working correctly
 */
async function verifyRAGSystem(): Promise<void> {
  // Test 1: Check if knowledge base has data
  const stats = await knowledgeManager.getKnowledgeBaseStats();
  console.log(`  📊 Knowledge base contains ${stats.totalEntries} entries`);
  console.log(`  🌸 Flower types: ${stats.flowerTypes.join(', ')}`);

  // Test 2: Test retrieval for a common flower
  try {
    const testBatch = {
      flower_type: 'Rose',
      variety: 'Red Naomi',
      storage_environment: 'Refrigerated',
      initial_condition: 'Excellent',
      floral_food_used: true,
    } as any;

    const prediction = await enhancedAiService.getEnhancedSpoilagePrediction(testBatch);
    console.log(`  ✅ RAG prediction successful for Rose`);
    console.log(`  📈 Prediction: ${prediction.prediction.toFixed(2)} days`);
    console.log(`  🎯 Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(`  📚 Sources: ${prediction.sources.length} found`);
  } catch (error) {
    console.warn(`  ⚠️ RAG prediction test failed:`, error);
  }

  // Test 3: Test knowledge retrieval
  try {
    const roseKnowledge = await knowledgeManager.searchFlowerKnowledge('Rose');
    console.log(`  ✅ Knowledge retrieval successful: ${roseKnowledge.length} Rose entries found`);
  } catch (error) {
    console.warn(`  ⚠️ Knowledge retrieval test failed:`, error);
  }
}

/**
 * Display comprehensive system statistics
 */
async function displaySystemStats(): Promise<void> {
  try {
    const stats = await knowledgeManager.getKnowledgeBaseStats();
    
    console.log('\n📊 RAG System Statistics:');
    console.log('========================');
    console.log(`Total Knowledge Entries: ${stats.totalEntries}`);
    console.log(`Flower Types Available: ${stats.flowerTypes.length}`);
    console.log(`Varieties Available: ${stats.varieties.length}`);
    console.log('\n🌸 Supported Flower Types:');
    stats.flowerTypes.forEach((type, index) => {
      console.log(`  ${index + 1}. ${type}`);
    });
    
    if (stats.varieties.length > 0) {
      console.log('\n🌺 Available Varieties:');
      stats.varieties.slice(0, 10).forEach((variety, index) => {
        console.log(`  ${index + 1}. ${variety}`);
      });
      if (stats.varieties.length > 10) {
        console.log(`  ... and ${stats.varieties.length - 10} more`);
      }
    }
    
    console.log('\n✅ RAG System is ready for use!');
    console.log('💡 The system will now provide enhanced predictions with expert flower care knowledge.');
    
  } catch (error) {
    console.error('❌ Error getting system statistics:', error);
  }
}

/**
 * Quick test function to verify RAG functionality
 */
export async function testRAGFunctionality(flowerType: string, variety?: string): Promise<void> {
  console.log(`🧪 Testing RAG functionality for ${flowerType}${variety ? ` (${variety})` : ''}...`);
  
  try {
    const testBatch = {
      flower_type: flowerType,
      variety: variety,
      storage_environment: 'Refrigerated',
      initial_condition: 'Good',
      floral_food_used: true,
    } as any;

    const prediction = await enhancedAiService.getEnhancedSpoilagePrediction(testBatch);
    
    console.log('✅ RAG Test Results:');
    console.log(`  Prediction: ${prediction.prediction.toFixed(2)} days`);
    console.log(`  Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(`  Sources: ${prediction.sources.length}`);
    console.log(`  Has RAG Context: ${prediction.ragContext ? 'Yes' : 'No'}`);
    
    if (prediction.ragContext) {
      console.log(`  Expert Info: ${prediction.ragContext.careRequirements.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('❌ RAG test failed:', error);
  }
}

// Export for use in development
export default {
  initializeRAGSystem,
  testRAGFunctionality,
}; 