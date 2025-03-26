
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The actual webhook URLs
const DEV_WEBHOOK_URL = "https://n8n-01.imagicrafterai.com/webhook-test/62d6d438-48ae-47db-850e-5fc52f54e843";
const PROD_WEBHOOK_URL = "https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843";

// All Supabase Edge Functions need to handle OPTIONS request for CORS preflight
function handleCors() {
  return new Response(null, {
    headers: CORS_HEADERS,
    status: 204, // No content
  });
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  try {
    // Extract the request body
    const { env, payload } = await req.json();
    console.log(`Request for ${env} environment with note_id ${payload.note_id}`);

    // Determine which webhook URL to use
    const webhookUrl = env === "dev" ? DEV_WEBHOOK_URL : PROD_WEBHOOK_URL;
    console.log(`Using webhook URL: ${webhookUrl}`);

    // Forward the request to the actual webhook URL
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Error from webhook: ${response.status} ${response.statusText}`);
      // Still return a success response to the client
      return new Response(
        JSON.stringify({ success: false, error: "Failed to process webhook request" }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          status: 200, // Still return 200 to the client
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    // Return error response
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200, // Still return 200 to the client
      }
    );
  }
});
