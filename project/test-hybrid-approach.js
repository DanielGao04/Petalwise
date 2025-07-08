const { enhancedAiService } = require('./utils/enhancedAiService');
const { getAISpoilagePrediction } = require('./utils/aiService');

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

async function testHybridApproach() {
  try {
    console.log('🧪 Testing Hybrid AI Approach...\n');
    
    console.log('📋 Test Batch Data:');
    console.log(`  Flower Type: ${testBatch.flower_type}`);
    console.log(`  Variety: ${testBatch.variety}`);
    console.log(`  Quantity: ${testBatch.quantity} ${testBatch.unit_of_measure}`);
    console.log(`  Initial Condition: ${testBatch.initial_condition}`);
    console.log(`  Storage: ${testBatch.storage_environment}\n`);
    
    console.log('🚀 Getting both AI predictions in parallel...\n');
    
    // Get both predictions in parallel
    const [basicPrediction, enhancedPrediction] = await Promise.all([
      getAISpoilagePrediction(testBatch),
      enhancedAiService.getEnhancedSpoilagePrediction(testBatch)
    ]);
    
    console.log('✅ Individual Results:');
    console.log('\n📊 Basic AI Service (Accurate Predictions):');
    console.log(`  Prediction: ${basicPrediction.prediction} days`);
    console.log(`  Confidence: ${Math.round((basicPrediction.confidence || 0) * 100)}%`);
    console.log(`  Reasoning: ${basicPrediction.reasoning?.substring(0, 80)}...`);
    console.log(`  Care Recommendations: ${basicPrediction.recommendations?.length || 0} items`);
    console.log(`  Financial Recommendations: ${basicPrediction.financialRecommendations?.length || 0} items`);
    
    console.log('\n💰 Enhanced AI Service (Financial Recommendations):');
    console.log(`  Prediction: ${enhancedPrediction.prediction} days`);
    console.log(`  Confidence: ${Math.round((enhancedPrediction.confidence || 0) * 100)}%`);
    console.log(`  Care Recommendations: ${enhancedPrediction.recommendations?.length || 0} items`);
    console.log(`  Financial Recommendations: ${enhancedPrediction.financialRecommendations?.length || 0} items`);
    console.log(`  Sources: ${enhancedPrediction.sources?.length || 0} items`);
    console.log(`  RAG Context: ${enhancedPrediction.ragContext ? 'Available' : 'None'}`);
    
    // Combine the best of both services
    const combinedPrediction = {
      prediction: basicPrediction.prediction,  // Use accurate prediction from old service
      confidence: basicPrediction.confidence || 0,
      reasoning: basicPrediction.reasoning || '',
      recommendations: basicPrediction.recommendations || [],  // Use proven care recommendations
      financialRecommendations: enhancedPrediction.financialRecommendations || [],  // Get financial recs from enhanced service
      sources: enhancedPrediction.sources || [],  // Keep RAG sources
      ragContext: enhancedPrediction.ragContext  // Keep RAG context
    };
    
    console.log('\n🎯 Combined Hybrid Results:');
    console.log(`  Final Prediction: ${combinedPrediction.prediction} days (from Basic AI)`);
    console.log(`  Confidence: ${Math.round(combinedPrediction.confidence * 100)}% (from Basic AI)`);
    console.log(`  Care Recommendations: ${combinedPrediction.recommendations.length} items (from Basic AI)`);
    console.log(`  Financial Recommendations: ${combinedPrediction.financialRecommendations.length} items (from Enhanced AI)`);
    console.log(`  Sources: ${combinedPrediction.sources.length} items (from Enhanced AI)`);
    console.log(`  RAG Context: ${combinedPrediction.ragContext ? 'Available' : 'None'} (from Enhanced AI)`);
    
    if (combinedPrediction.financialRecommendations.length > 0) {
      console.log('\n💰 Financial Recommendations (from Enhanced AI):');
      combinedPrediction.financialRecommendations.forEach((rec, index) => {
        console.log(`\n  ${index + 1}. ${rec.title}`);
        console.log(`     Type: ${rec.type}`);
        console.log(`     Urgency: ${rec.urgency.toUpperCase()}`);
        console.log(`     Time Window: ${rec.timeWindow}`);
        if (rec.discountPercentage) {
          console.log(`     Discount: ${rec.discountPercentage}%`);
        }
        console.log(`     Description: ${rec.description.substring(0, 60)}...`);
      });
    }
    
    console.log('\n✅ Hybrid approach test completed successfully!');
    console.log('   - Accurate predictions from Basic AI');
    console.log('   - Financial recommendations from Enhanced AI');
    console.log('   - Best of both worlds achieved!');
    
  } catch (error) {
    console.error('❌ Hybrid approach test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testHybridApproach(); 