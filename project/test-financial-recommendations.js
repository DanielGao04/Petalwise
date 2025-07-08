const { enhancedAiService } = require('./utils/enhancedAiService');

// Test flower batch data
const testBatch = {
  id: 'test-batch-1',
  user_id: 'test-user-1',
  flower_type: 'Rose',
  variety: 'Red Rose',
  quantity: 24,
  unit_of_measure: 'stems',
  purchase_date: '2024-01-15',
  expected_shelf_life: 7,
  shelf_life_unit: 'days',
  supplier: 'Test Supplier',
  initial_condition: 'Good',
  storage_environment: 'Refrigerated',
  water_type: 'Filtered',
  humidity_level: '60%',
  floral_food_used: true,
  vase_cleanliness: 'Clean',
  dynamic_spoilage_date: '2024-01-18T12:00:00Z',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  visual_notes: 'Slight wilting on edges',
  ai_prediction: null,
  ai_confidence: null,
  ai_reasoning: null,
  ai_recommendations: null,
  ai_financial_recommendations: null,
  ai_last_updated: null,
  ai_detailed_prediction: null
};

async function testFinancialRecommendations() {
  try {
    console.log('🧪 Testing Financial Recommendations Feature...\n');
    
    console.log('📋 Test Batch Data:');
    console.log(`  Flower Type: ${testBatch.flower_type}`);
    console.log(`  Variety: ${testBatch.variety}`);
    console.log(`  Quantity: ${testBatch.quantity} ${testBatch.unit_of_measure}`);
    console.log(`  Initial Condition: ${testBatch.initial_condition}`);
    console.log(`  Storage: ${testBatch.storage_environment}`);
    console.log(`  Expected Shelf Life: ${testBatch.expected_shelf_life} ${testBatch.shelf_life_unit}\n`);
    
    console.log('🚀 Generating AI prediction with financial recommendations...\n');
    
    const result = await enhancedAiService.getEnhancedSpoilagePrediction(testBatch);
    
    console.log('✅ AI Prediction Results:');
    console.log(`  Prediction: ${result.prediction} days`);
    console.log(`  Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log(`  Reasoning: ${result.reasoning.substring(0, 100)}...`);
    console.log(`  Care Recommendations: ${result.recommendations.length} items`);
    console.log(`  Financial Recommendations: ${result.financialRecommendations.length} items\n`);
    
    if (result.financialRecommendations.length > 0) {
      console.log('💰 Financial Recommendations:');
      result.financialRecommendations.forEach((rec, index) => {
        console.log(`\n  ${index + 1}. ${rec.title}`);
        console.log(`     Type: ${rec.type}`);
        console.log(`     Urgency: ${rec.urgency.toUpperCase()}`);
        console.log(`     Time Window: ${rec.timeWindow}`);
        if (rec.discountPercentage) {
          console.log(`     Discount: ${rec.discountPercentage}%`);
        }
        if (rec.suggestedPrice) {
          console.log(`     Suggested Price: $${rec.suggestedPrice}`);
        }
        console.log(`     Description: ${rec.description}`);
        console.log(`     Justification: ${rec.justification.substring(0, 80)}...`);
        console.log(`     Action Items: ${rec.actionItems.length} items`);
      });
    } else {
      console.log('⚠️  No financial recommendations generated');
    }
    
    console.log('\n🎯 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFinancialRecommendations(); 