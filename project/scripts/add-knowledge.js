require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize Supabase
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

async function generateEmbedding(data) {
  const text = `${data.flower_type} ${data.variety || ''} ${data.care_requirements} ${data.optimal_temperature} ${data.optimal_humidity} ${data.water_requirements} ${data.ethylene_sensitivity} ${data.common_issues} ${data.vase_life_tips}`;
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function addFlowerKnowledge(data) {
  try {
    console.log(`Adding knowledge for ${data.flower_type}${data.variety ? ` (${data.variety})` : ''}...`);
    
    // Generate embedding automatically
    const embedding = await generateEmbedding(data);
    
    // Insert into database
    const { error } = await supabase
      .from('flower_knowledge')
      .insert({
        ...data,
        embedding,
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully added ${data.flower_type} knowledge`);
  } catch (error) {
    console.error('❌ Error adding flower knowledge:', error);
    throw error;
  }
}

// Example usage - add your flower knowledge here
async function addSampleKnowledge() {
  const newKnowledge = [
    {
      flower_type: "Rose",
      variety: "",
      care_requirements: "Cut stems at an angle, remove submerged foliage, use floral food, change water regularly, avoid direct sunlight and heat",
      optimal_temperature: "33-37°F",
      optimal_humidity: "High humidity (75-85%)",
      water_requirements: "Clean, pure water; avoid soft water (high sodium) and high mineral content; slightly acidic water (pH 3.0-4.5) preferred; use floral food",
      ethylene_sensitivity: "Toxic to roses and carnations (sodium in soft water); ethylene gas causes early death",
      common_issues: "Wilting, bent neck, bacterial blockage, ethylene damage",
      vase_life_tips: "Recut stems, use floral food, keep in cool location, avoid ethylene sources, remove submerged foliage",
      source_url: "https://www.floraldesigninstitute.com/pages/flower-care",
      source_name: "Floral Design Institute"
    },
    {
      flower_type: "Lily",
      variety: "",
      care_requirements: "Remove anthers to prevent staining, recut stems, change water every 2-3 days, remove wilted flowers, avoid direct sunlight",
      optimal_temperature: "33-37°F (cold-sensitive varieties may prefer slightly higher)",
      optimal_humidity: "Not explicitly stated but generally high humidity is beneficial",
      water_requirements: "Clean water, use flower food",
      ethylene_sensitivity: "Highly sensitive to ethylene (bud drop, drying)",
      common_issues: "Bud drop, drying, wilting",
      vase_life_tips: "Recut stems, use flower food, keep in cool area, remove anthers, change water regularly",
      source_url: "https://floralife.com/flowers/asiatic-lily/",
      source_name: "FloraLife"
    },
    {
      flower_type: "Tulip",
      variety: "",
      care_requirements: "Keep in cool location, out of direct sunlight, cut stems and change water daily/every other day, rinse vase",
      optimal_temperature: "32-35°F (0-2°C)",
      optimal_humidity: "85-95%",
      water_requirements: "Clean water, use flower food",
      ethylene_sensitivity: "Not generally ethylene sensitive",
      common_issues: "Stem elongation, wilting",
      vase_life_tips: "Recut stems, use flower food, keep cool, change water frequently",
      source_url: "https://www.chrysal.com/en-us/tips/flower-of-the-month/tulip-care-tips",
      source_name: "Chrysal"
    },
    {
      flower_type: "Carnation",
      variety: "",
      care_requirements: "Recut stems, remove submerged foliage, use floral food, change water regularly, avoid ethylene sources",
      optimal_temperature: "32-38°F (1-3°C)",
      optimal_humidity: "75-85%",
      water_requirements: "Clean water, use flower food",
      ethylene_sensitivity: "Extremely sensitive to ethylene",
      common_issues: "Wilting, ethylene damage",
      vase_life_tips: "Recut stems, use flower food, keep in cool location, avoid ethylene sources",
      source_url: "https://www.chrysal.com/en-us/tips/flower-of-the-month/carnation-care-tips",
      source_name: "Chrysal"
    },
    {
      flower_type: "Chrysanthemum",
      variety: "",
      care_requirements: "Recut stems, remove submerged foliage, use floral food, avoid draught and direct heat",
      optimal_temperature: "0-1°C (32-35°F)",
      optimal_humidity: "Not explicitly stated but generally high humidity is beneficial",
      water_requirements: "Fresh tap water, use flower food",
      ethylene_sensitivity: "Sensitive to ethylene",
      common_issues: "Wilting, ethylene damage",
      vase_life_tips: "Recut stems, use flower food, keep in cool location, avoid ethylene sources",
      source_url: "https://postharvest.ucdavis.edu/produce-facts-sheets/chrysanthemum-florist-mum",
      source_name: "UC Davis Postharvest Technology Center"
    }
  ];

  for (const knowledge of newKnowledge) {
    await addFlowerKnowledge(knowledge);
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 All knowledge added successfully!');
}

// Run the script
if (require.main === module) {
  addSampleKnowledge().catch(console.error);
}

module.exports = { addFlowerKnowledge, generateEmbedding }; 