
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
    console.warn("DEPRECATED FUNCTION ACCESSED: image-analysis - This function has been deprecated and will be removed. Please use file-analysis instead.");
    
    // Parse request body for logging
    const requestData = await req.json();
    console.log("Deprecated image-analysis accessed with request data:", JSON.stringify(requestData));
    
    // Return deprecation notice
    return new Response(
      JSON.stringify({ 
        error: "DEPRECATED ENDPOINT", 
        message: "This endpoint has been deprecated and will be removed soon. Please use file-analysis instead for all image and file analysis needs.",
        alternativeEndpoint: "file-analysis"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 410 // Gone
      }
    );
  } catch (error) {
    console.error("Error in deprecated image-analysis function:", error);
    return new Response(
      JSON.stringify({ 
        error: "DEPRECATED ENDPOINT", 
        message: "This endpoint has been deprecated and will be removed soon. Please use file-analysis instead for all image and file analysis needs.",
        parseError: error.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 410 // Gone
      }
    );
  }
});
