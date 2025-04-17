
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
      status: 204, // No content
    });
  }

  // Log the deprecation access
  console.warn("DEPRECATED FUNCTION ACCESSED: n8n-proxy - This function has been deprecated and will be removed. Please use n8n-webhook-proxy instead.");
  
  try {
    const { env, payload } = await req.json();
    
    // Log the request details for debugging
    console.log(`Deprecated n8n-proxy accessed with env=${env}, payload:`, JSON.stringify(payload));
    
    // Return deprecation notice with error status
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "DEPRECATED ENDPOINT", 
        message: "This endpoint has been deprecated and will be removed soon. Please use n8n-webhook-proxy instead."
      }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 410, // Gone
      }
    );
  } catch (error) {
    console.error(`Error processing deprecated request: ${error.message}`);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "DEPRECATED ENDPOINT",
        message: "This endpoint has been deprecated and will be removed soon. Please use n8n-webhook-proxy instead."
      }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 410, // Gone
      }
    );
  }
});
