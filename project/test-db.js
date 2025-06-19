const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing flower_knowledge database...\n');

  try {
    // Check if table exists and has data
    const { data, error } = await supabase
      .from('flower_knowledge')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log(`📊 Found ${data.length} entries in flower_knowledge table\n`);

    if (data.length === 0) {
      console.log('❌ No data found in flower_knowledge table');
      console.log('💡 Run the RAG initialization in the mobile app first');
      return;
    }

    // Show sample data
    console.log('📋 Sample entries:');
    data.forEach((entry, index) => {
      console.log(`\n${index + 1}. ${entry.flower_type}${entry.variety ? ` (${entry.variety})` : ''}`);
      console.log(`   Care: ${entry.care_requirements.substring(0, 100)}...`);
      console.log(`   Has embedding: ${entry.embedding ? 'Yes' : 'No'}`);
    });

    // Test search for Rose
    console.log('\n🔍 Testing search for "Rose"...');
    const { data: roseData, error: roseError } = await supabase
      .from('flower_knowledge')
      .select('*')
      .ilike('flower_type', '%Rose%');

    if (roseError) {
      console.error('❌ Rose search error:', roseError);
    } else {
      console.log(`✅ Found ${roseData.length} Rose entries`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabase(); 