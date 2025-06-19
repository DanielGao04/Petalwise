// Simple script to initialize the RAG system
// Run this with: node scripts/init-rag.js

const { enhancedAiService } = require('../utils/enhancedAiService');
const { knowledgeManager } = require('../utils/knowledgeManager');

async function main() {
  console.log('🚀 Starting RAG system initialization...');
  
  try {
    // Initialize RAG system
    console.log('1. Initializing RAG system...');
    await enhancedAiService.initializeRAG();
    
    // Add sample flower knowledge
    console.log('2. Adding sample flower knowledge...');
    await knowledgeManager.addFlowerKnowledge({
      flower_type: 'Rose',
      variety: 'Red Naomi',
      care_requirements: 'Red Naomi roses require cool temperatures (32-35°F) and high humidity (85-90%). They should be stored in clean water with floral preservative. Remove any damaged petals and leaves before storage.',
      optimal_conditions: 'Temperature: 32-35°F, Humidity: 85-90%, Water: Clean with floral preservative, Storage: Upright in clean containers',
      common_issues: 'Botrytis (gray mold), ethylene sensitivity, dehydration, stem blockage',
      vase_life_tips: 'Recut stems at 45° angle, remove leaves below water line, change water every 2-3 days, keep away from direct sunlight and heat sources',
      sources: ['American Rose Society', 'Floral Industry Research Consortium']
    });

    await knowledgeManager.addFlowerKnowledge({
      flower_type: 'Rose',
      variety: 'White Avalanche',
      care_requirements: 'White Avalanche roses are ethylene-sensitive and require immediate processing. Store at 33-35°F with 90-95% humidity. Use anti-ethylene products and clean water with floral preservative.',
      optimal_conditions: 'Temperature: 33-35°F, Humidity: 90-95%, Anti-ethylene treatment recommended, Clean water with preservative',
      common_issues: 'Ethylene damage, petal browning, stem rot, dehydration',
      vase_life_tips: 'Process immediately upon arrival, use anti-ethylene products, maintain high humidity, avoid temperature fluctuations',
      sources: ['Society of American Florists', 'University of California Extension']
    });

    await knowledgeManager.addFlowerKnowledge({
      flower_type: 'Tulip',
      variety: 'Red Emperor',
      care_requirements: 'Red Emperor tulips continue growing after harvest. Store at 32-35°F in dry conditions. They prefer shallow water and will bend toward light sources.',
      optimal_conditions: 'Temperature: 32-35°F, Storage: Dry conditions, Water: Shallow, avoid direct light',
      common_issues: 'Continued growth, stem bending, petal drop, ethylene sensitivity',
      vase_life_tips: 'Use shallow water, avoid direct sunlight, keep cool, handle gently as stems are fragile',
      sources: ['Netherlands Flower Bulb Information Center', 'International Flower Bulb Centre']
    });

    console.log('✅ RAG system initialized successfully!');
    console.log('📚 Sample flower knowledge added to database');
    
  } catch (error) {
    console.error('❌ Error initializing RAG system:', error);
  }
}

main(); 