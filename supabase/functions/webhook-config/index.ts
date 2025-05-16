
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Log the deprecation access
    console.warn("DEPRECATED FUNCTION ACCESSED: webhook-config - This function has been deprecated and will be removed. Please use n8n-webhook-proxy/config instead.");
    
    // Get environment from query parameters for logging
    const url = new URL(req.url);
    const env = url.searchParams.get("env") || "production";
    console.log(`Deprecated webhook-config accessed with env=${env}`);
    
    // Return deprecation notice
    return new Response(
      JSON.stringify({ 
        error: "DEPRECATED ENDPOINT", 
        message: "This endpoint has been deprecated and will be removed soon. Please use n8n-webhook-proxy/config instead for webhook configuration.",
        alternativeEndpoint: "n8n-webhook-proxy/config"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 410 // Gone
      }
    );
  } catch (error) {
    console.error("Error processing deprecated webhook config request:", error);
    return new Response(
      JSON.stringify({ 
        error: "DEPRECATED ENDPOINT", 
        message: "This endpoint has been deprecated and will be removed soon. Please use n8n-webhook-proxy/config instead for webhook configuration.",
        errorDetails: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 410 // Gone
      }
    );
  }
});
