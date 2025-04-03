
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Version tracking to help identify if deployment was successful
const FUNCTION_VERSION = "1.1.0";

// The actual n8n webhook URLs for note operations
const NOTE_DEV_WEBHOOK_URL = "https://n8n-01.imagicrafterai.com/webhook-test/62d6d438-48ae-47db-850e-5fc52f54e843";
const NOTE_PROD_WEBHOOK_URL = "https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843";
const NOTE_STAGING_WEBHOOK_URL = Deno.env.get("STAGING_NOTE_WEBHOOK_URL") || NOTE_DEV_WEBHOOK_URL;

// All webhook configurations
const webhookConfigs = {
  "file-analysis": {
    development: Deno.env.get("DEV_FILE_ANALYSIS_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
    staging: Deno.env.get("STAGING_FILE_ANALYSIS_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-staging/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
    production: Deno.env.get("PROD_FILE_ANALYSIS_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
  },
  "report": {
    development: Deno.env.get("DEV_REPORT_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/785af48f-c1b1-484e-8bea-21920dee1146",
    staging: Deno.env.get("STAGING_REPORT_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-staging/785af48f-c1b1-484e-8bea-21920dee1146",
    production: Deno.env.get("PROD_REPORT_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/785af48f-c1b1-484e-8bea-21920dee1146",
  },
  "note": {
    development: NOTE_DEV_WEBHOOK_URL,
    staging: NOTE_STAGING_WEBHOOK_URL,
    production: NOTE_PROD_WEBHOOK_URL,
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const endpoint = pathParts[pathParts.length - 1];
  
  console.log(`Processing request for endpoint: ${endpoint}`);
  
  try {
    // Status endpoint - check if function is responsive
    if (endpoint === 'status') {
      return new Response(
        JSON.stringify({ 
          status: "ok", 
          version: FUNCTION_VERSION,
          timestamp: new Date().toISOString(),
          config: {
            availableEndpoints: ["status", "config", "proxy"] 
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    // Configuration endpoint
    else if (endpoint === 'config') {
      return handleConfigRequest(req, url);
    } 
    // Proxy endpoint
    else if (endpoint === 'proxy') {
      return handleProxyRequest(req);
    } 
    // Legacy support for root path (assume proxy request)
    else if (endpoint === 'n8n-webhook-proxy') {
      return handleProxyRequest(req);
    }
    // Unknown endpoint
    else {
      return new Response(
        JSON.stringify({ error: "Unknown endpoint", endpoint }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Handle configuration requests
async function handleConfigRequest(req: Request, url: URL) {
  const env = url.searchParams.get("env") || "production";
  
  console.log(`Retrieving webhook configuration for environment: ${env}`);
  
  // Calculate current webhooks for the specified environment
  const currentWebhooks = {
    "file-analysis": webhookConfigs["file-analysis"][env],
    "report": webhookConfigs.report[env],
    "note": webhookConfigs.note[env],
  };
  
  return new Response(
    JSON.stringify({
      environment: env,
      webhooks: webhookConfigs,
      currentWebhooks,
      version: FUNCTION_VERSION,
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}

// Handle proxy requests
async function handleProxyRequest(req: Request) {
  const { env, payload, type = "note" } = await req.json();
  
  console.log(`Proxying ${type} request for ${env || 'default'} environment`);
  
  // Support legacy format without type parameter
  const webhookType = type || "note";
  
  // Support both 'dev' and 'development' format for environment
  const environment = env === "dev" ? "development" : 
                     env === "prod" ? "production" : 
                     env || "production";
  
  // Determine which webhook URL to use
  let webhookUrl;
  
  if (webhookConfigs[webhookType] && webhookConfigs[webhookType][environment]) {
    webhookUrl = webhookConfigs[webhookType][environment];
  } else {
    // Fallback to legacy behavior for backward compatibility
    webhookUrl = environment === "development" ? NOTE_DEV_WEBHOOK_URL : NOTE_PROD_WEBHOOK_URL;
  }
  
  console.log(`Using webhook URL: ${webhookUrl} for ${webhookType}`);
  
  try {
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to process webhook request",
          status: response.status,
          statusText: response.statusText
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Still return 200 to the client
        }
      );
    }
    
    // Try to parse the response from the webhook
    try {
      const responseData = await response.json();
      return new Response(
        JSON.stringify({ success: true, data: responseData }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (e) {
      // If the response is not JSON, return a generic success
      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (fetchError) {
    console.error(`Network error when calling webhook: ${fetchError.message}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Network error when calling webhook",
        details: fetchError.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Still return 200 to the client
      }
    );
  }
}
