
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the request
    const { endpoint, method = 'POST', body, headers: requestHeaders = {} } = await req.json();

    // Validate the endpoint to ensure it's an OpenAI API endpoint
    const allowedEndpoints = [
      'chat/completions',
      'completions',
      'images/generations',
      'images/edits',
      'images/variations',
      'embeddings',
      'audio/transcriptions',
      'audio/translations',
      'audio/speech',
      'moderations'
    ];

    if (!allowedEndpoints.some(allowed => endpoint.includes(allowed))) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construct the full OpenAI API URL
    const openAIUrl = `https://api.openai.com/v1/${endpoint}`;

    // Prepare headers for OpenAI API
    const openAIHeaders = {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      ...requestHeaders
    };

    // Make the request to OpenAI API
    const openAIResponse = await fetch(openAIUrl, {
      method,
      headers: openAIHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Get the response data
    const responseData = await openAIResponse.json();

    // Log the API usage for monitoring (optional)
    console.log(`OpenAI API call - Endpoint: ${endpoint}, Status: ${openAIResponse.status}`);

    // Return the OpenAI response
    return new Response(
      JSON.stringify(responseData),
      {
        status: openAIResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in OpenAI proxy:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
