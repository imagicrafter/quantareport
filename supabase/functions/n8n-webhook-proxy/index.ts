
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Version tracking to help identify if deployment was successful
const FUNCTION_VERSION = "1.3.0";

// The actual n8n webhook URLs for various operations
const webhookConfigs = {
  "note": {
    development: Deno.env.get("DEV_NOTE_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/62d6d438-48ae-47db-850e-5fc52f54e843",
    staging: Deno.env.get("STAGING_NOTE_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843",
    production: Deno.env.get("PROD_NOTE_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843",
  },
  "file-analysis": {
    development: Deno.env.get("DEV_FILE_ANALYSIS_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
    staging: Deno.env.get("STAGING_FILE_ANALYSIS_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
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
            availableEndpoints: ["status", "config", "proxy"],
            webhookTypes: Object.keys(webhookConfigs)
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
      return handleProxyRequest(req, url);
    } 
    // Legacy support for root path (assume proxy request)
    else if (endpoint === 'n8n-webhook-proxy') {
      return handleProxyRequest(req, url);
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
  let env = url.searchParams.get("env");
  if (!env) {
    try {
      const body = await req.json();
      env = body.env;
    } catch (e) {
      // If no env is provided in query params or body, default to production
      env = "production";
    }
  }
  
  // Normalize environment names
  env = env === "dev" ? "development" : 
       env === "prod" ? "production" : 
       env || "production";
  
  console.log(`Retrieving webhook configuration for environment: ${env}`);
  
  // Calculate current webhooks for the specified environment
  const currentWebhooks = {};
  for (const [type, environments] of Object.entries(webhookConfigs)) {
    currentWebhooks[type] = environments[env] || environments["production"];
  }
  
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
async function handleProxyRequest(req: Request, url: URL) {
  let payload, type, env;
  
  // Check if parameters are in URL query params
  type = url.searchParams.get("type");
  env = url.searchParams.get("env");
  
  try {
    // Try to get parameters from request body
    const body = await req.json();
    payload = body.payload;
    
    // If not in query params, try to get from body
    if (!type) type = body.type;
    if (!env) env = body.env;
  } catch (e) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Invalid request body - missing payload" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
  
  // Default to note type if not specified
  type = type || "note";
  
  // Support both 'dev' and 'development' format for environment
  env = env === "dev" ? "development" : 
       env === "prod" ? "production" : 
       env || "production";
  
  console.log(`Proxying ${type} request for ${env} environment`);
  
  // Determine which webhook URL to use
  let webhookUrl;
  
  if (webhookConfigs[type] && webhookConfigs[type][env]) {
    webhookUrl = webhookConfigs[type][env];
  } else {
    // Fallback to the note webhook for backward compatibility
    webhookUrl = webhookConfigs.note[env];
  }
  
  console.log(`Using webhook URL: ${webhookUrl} for ${type}`);
  
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
