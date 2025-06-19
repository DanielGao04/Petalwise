const { enhancedAiService } = require('./utils/enhancedAiService');

async function testRAG() {
  console.log('🧪 Testing RAG System...\n');

  try {
    // Test 1: Initialize RAG
    console.log('1. Initializing RAG system...');
    await enhancedAiService.initializeRAG();
    console.log('✅ RAG system initialized\n');

    // Test 2: Test enhanced prediction
    console.log('2. Testing enhanced AI prediction...');
    const testBatch = {
      flower_type: 'Rose',
      variety: 'Red Naomi',
      quantity: 50,
      unit_of_measure: 'stems',
      supplier: 'Test Supplier',
      initial_condition: 'Excellent',
      storage_environment: 'Refrigerated',
      floral_food_used: true,
      vase_cleanliness: 'Clean',
      water_type: 'Filtered',
      humidity_level: '60%',
      expected_shelf_life: 7,
      dynamic_spoilage_date: new Date().toISOString()
    };

    const prediction = await enhancedAiService.getEnhancedSpoilagePrediction(testBatch);
    
    console.log('✅ Enhanced prediction successful!');
    console.log(`   Prediction: ${prediction.prediction.toFixed(2)} days`);
    console.log(`   Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(`   Sources: ${prediction.sources.length}`);
    console.log(`   Has RAG context: ${prediction.ragContext ? 'Yes' : 'No'}`);
    
    if (prediction.ragContext) {
      console.log(`   Flower type: ${prediction.ragContext.flowerType}`);
      console.log(`   Care requirements: ${prediction.ragContext.careRequirements.substring(0, 50)}...`);
    }
    
    console.log('\n🎉 RAG system is working correctly!');

  } catch (error) {
    console.error('❌ RAG system test failed:', error.message);
    console.error('Full error:', error);
  }
}

testRAG(); 