const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize Supabase
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
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

// Comprehensive flower knowledge data
const comprehensiveKnowledge = [
  {
    flower_type: "Rose",
    variety: "Hybrid Tea",
    care_requirements: "Trim stems at 45°, remove leaves below water",
    optimal_temperature: "2–5°C (storage)",
    optimal_humidity: "70–80%",
    water_requirements: "Change water every 2 days",
    ethylene_sensitivity: "High",
    common_issues: "Botrytis, bent neck",
    vase_life_tips: "Use floral preservative + aspirin",
    source_url: "https://www.flowercouncil.co.uk/",
    source_name: "Flower Council of Holland"
  },
  {
    flower_type: "Rose",
    variety: "Floribunda",
    care_requirements: "Remove thorns, avoid crowding",
    optimal_temperature: "2–5°C (storage)",
    optimal_humidity: "70–80%",
    water_requirements: "Change water every 2 days",
    ethylene_sensitivity: "High",
    common_issues: "Mildew, black spot",
    vase_life_tips: "Add sugar to water",
    source_url: "https://www.rhs.org.uk/",
    source_name: "Royal Horticultural Society"
  },
  {
    flower_type: "Rose",
    variety: "Grandiflora",
    care_requirements: "Prune spent blooms, provide support",
    optimal_temperature: "2–5°C (storage)",
    optimal_humidity: "70–80%",
    water_requirements: "Change water every 2 days",
    ethylene_sensitivity: "High",
    common_issues: "Aphids, weak stems",
    vase_life_tips: "Use copper vase",
    source_url: "https://www.aboutflowers.com/",
    source_name: "Society of American Florists"
  },
  {
    flower_type: "Tulip",
    variety: "Darwin Hybrid",
    care_requirements: "Store upright; keeps growing after cut",
    optimal_temperature: "1–4°C (storage)",
    optimal_humidity: "60–70%",
    water_requirements: "Moderate",
    ethylene_sensitivity: "Moderate",
    common_issues: "Drooping stems",
    vase_life_tips: "Cold water; avoid fruit/heat",
    source_url: "https://www.flowerbulbs.com/",
    source_name: "Flower Bulb Research Program"
  },
  {
    flower_type: "Tulip",
    variety: "Parrot",
    care_requirements: "Handle gently, petals bruise easily",
    optimal_temperature: "1–4°C (storage)",
    optimal_humidity: "60–70%",
    water_requirements: "Moderate",
    ethylene_sensitivity: "Moderate",
    common_issues: "Bent necks",
    vase_life_tips: "Wrap stems in paper",
    source_url: "https://www.dutchgrown.com/",
    source_name: "DutchGrown"
  },
  {
    flower_type: "Lily",
    variety: "Stargazer (Oriental)",
    care_requirements: "Remove pollen to prevent stains",
    optimal_temperature: "4–7°C (storage)",
    optimal_humidity: "70–80%",
    water_requirements: "Keep soil moist",
    ethylene_sensitivity: "Moderate",
    common_issues: "Pollen stains, bud blast",
    vase_life_tips: "Cut stems underwater",
    source_url: "https://www.rhs.org.uk/",
    source_name: "Royal Horticultural Society"
  },
  {
    flower_type: "Lily",
    variety: "Asiatic",
    care_requirements: "Needs bright indirect light",
    optimal_temperature: "4–7°C (storage)",
    optimal_humidity: "70–80%",
    water_requirements: "Keep soil moist",
    ethylene_sensitivity: "Moderate",
    common_issues: "Leaf scorch",
    vase_life_tips: "Avoid direct sun",
    source_url: "https://www.longfield-gardens.com/",
    source_name: "Longfield Gardens"
  },
  {
    flower_type: "Carnation",
    variety: "Standard",
    care_requirements: "Recut stems, remove lower leaves",
    optimal_temperature: "0–4°C (storage)",
    optimal_humidity: "60–70%",
    water_requirements: "Low",
    ethylene_sensitivity: "Low",
    common_issues: "Stem breakage",
    vase_life_tips: "Use floral foam",
    source_url: "https://www.aboutflowers.com/",
    source_name: "Society of American Florists"
  },
  {
    flower_type: "Carnation",
    variety: "Mini (Spray)",
    care_requirements: "Recut stems frequently",
    optimal_temperature: "0–4°C (storage)",
    optimal_humidity: "60–70%",
    water_requirements: "Low",
    ethylene_sensitivity: "Low",
    common_issues: "Bacterial clogging",
    vase_life_tips: "Use bleach-free water",
    source_url: "https://www.aboutflowers.com/",
    source_name: "Society of American Florists"
  },
  {
    flower_type: "Gerbera Daisy",
    variety: "Spider",
    care_requirements: "Support hollow stems with wire",
    optimal_temperature: "4–7°C (storage)",
    optimal_humidity: "70–80%",
    water_requirements: "Moderate",
    ethylene_sensitivity: "High",
    common_issues: "Stem breakage, crown rot",
    vase_life_tips: "Avoid wetting crown",
    source_url: "https://www.gardeningknowhow.com/",
    source_name: "Gardening Know How"
  }
];

async function addComprehensiveKnowledge() {
  console.log(`🚀 Starting to add ${comprehensiveKnowledge.length} flower knowledge entries...`);
  
  for (let i = 0; i < comprehensiveKnowledge.length; i++) {
    const knowledge = comprehensiveKnowledge[i];
    try {
      await addFlowerKnowledge(knowledge);
      console.log(`Progress: ${i + 1}/${comprehensiveKnowledge.length}`);
      
      // Add delay to avoid rate limiting
      if (i < comprehensiveKnowledge.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Failed to add ${knowledge.flower_type} (${knowledge.variety}):`, error.message);
      // Continue with next entry
    }
  }
  
  console.log('🎉 Comprehensive knowledge addition completed!');
}

// Run the script
if (require.main === module) {
  addComprehensiveKnowledge().catch(console.error);
}

module.exports = { addComprehensiveKnowledge, addFlowerKnowledge, generateEmbedding }; 