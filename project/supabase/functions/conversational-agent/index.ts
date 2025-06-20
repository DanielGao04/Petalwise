// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@^5.3.0';

// Verify and get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL');
if (!supabaseUrl) throw new Error("Function is missing SUPABASE_URL env var.");

const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseServiceKey) throw new Error("Function is missing SUPABASE_SERVICE_ROLE_KEY env var.");

const openaiApiKey = Deno.env.get('EXPO_PUBLIC_OPENAI_API_KEY') || Deno.env.get('OPENAI_API_KEY');
if (!openaiApiKey) throw new Error("Function is missing a valid OpenAI API Key. Did you set EXPO_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY in the Supabase secrets?");

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getContext(query: string, userId: string) {
  let context = '';

  // Check if query is about user's inventory
  const inventoryKeywords = ['my', 'inventory', 'batch', 'flower', 'discount', 'price'];
  if (inventoryKeywords.some(k => query.toLowerCase().includes(k))) {
    const { data: batches, error } = await supabaseAdmin
      .from('flower_batches')
      .select('flower_type, variety, quantity, dynamic_spoilage_date, ai_recommendations')
      .eq('user_id', userId)
      .gt('dynamic_spoilage_date', new Date().toISOString())
      .limit(10);
      
    if (error) console.error('Error fetching batches:', error);
    if (batches && batches.length > 0) {
      context += 'Here is the user\'s current inventory nearing spoilage:\n';
      context += JSON.stringify(batches, null, 2);
      context += '\n\n';
    }
  }

  // Get RAG context for general knowledge
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });
  const embedding = embeddingResponse.data[0].embedding;

  const { data: documents, error: matchError } = await supabaseAdmin.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 5,
  });

  if (matchError) console.error('Error matching documents:', matchError);
  if (documents && documents.length > 0) {
    context += 'Here is some potentially relevant information from our knowledge base:\n';
    context += documents.map((d: any) => d.content).join('\n---\n');
  }

  return context;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, history } = await req.json();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      throw new Error('User not found');
    }

    const context = await getContext(query, user.id);

    const systemPrompt = `You are Petalwise Agent, a friendly and expert AI assistant for florists. Your goal is to provide clear, concise, and actionable advice.
- Use the provided context about the user's inventory and the knowledge base to answer questions.
- If you use information from the context, mention it naturally in your response.
- Keep your answers helpful and focused on floristry.
- If you don't know the answer, say so clearly. Do not make up information.
- The user's inventory context shows flowers nearing spoilage. Use this to give specific advice on discounting or usage.
- The knowledge base context provides general flower care and business information.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return new Response(JSON.stringify({ response: completion.choices[0].message.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/conversational-agent' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
