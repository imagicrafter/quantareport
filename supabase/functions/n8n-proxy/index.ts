
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'No target URL provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get method, either from query param or from request
    const method = url.searchParams.get('method') || req.method;
    
    // Build headers for the target request, copying relevant headers from the incoming request
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // Parse and forward the body
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const requestData = await req.json();
        body = JSON.stringify(requestData);
      } catch (e) {
        // If parsing fails, try to get the text body
        body = await req.text();
      }
    }
    
    // Forward the request to the target URL
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });
    
    // Read the response from n8n
    const responseData = await response.text();
    
    // Return the proxied response
    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in n8n proxy:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
