import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Version tracking to help identify if deployment was successful
const FUNCTION_VERSION = "1.5.0";

// The actual n8n webhook URLs for various operations
const webhookConfigs = {
  "note": {
    development: Deno.env.get("DEV_NOTE_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/62d6d438-48ae-47db-850e-5fc52f54e843",
    staging: Deno.env.get("STAGING_NOTE_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843",
    production: Deno.env.get("PROD_NOTE_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/62d6d438-48ae-47db-850e-5fc52f54e843",
    // Add test-specific webhook for notes
    developmentTest: Deno.env.get("DEV_NOTE_TEST_WEBHOOK_URL") || 
      Deno.env.get("DEV_NOTE_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/62d6d438-48ae-47db-850e-5fc52f54e843",
  },
  "file-analysis": {
    development: Deno.env.get("DEV_FILE_ANALYSIS_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
    staging: Deno.env.get("STAGING_FILE_ANALYSIS_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
    production: Deno.env.get("PROD_FILE_ANALYSIS_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
    // Add test-specific webhook for file analysis
    developmentTest: Deno.env.get("DEV_FILE_ANALYSIS_TEST_WEBHOOK_URL") || 
      Deno.env.get("DEV_FILE_ANALYSIS_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
  },
  "report": {
    development: Deno.env.get("DEV_REPORT_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/b260e5d6-3a5b-4cbf-8b5a-e8a95ed8e340",
    staging: Deno.env.get("STAGING_REPORT_WEBHOOK_URL") || 
      "https://n8n-02.imagicrafterai.com/webhook-test/fee2fa15-4df5-49e2-a274-c88b2540c20a",
    production: Deno.env.get("PROD_REPORT_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook/785af48f-c1b1-484e-8bea-21920dee1146",
    // Add test-specific webhook for reports
    developmentTest: Deno.env.get("DEV_REPORT_TEST_WEBHOOK_URL") || 
      Deno.env.get("DEV_REPORT_WEBHOOK_URL") || 
      "https://n8n-01.imagicrafterai.com/webhook-test/b260e5d6-3a5b-4cbf-8b5a-e8a95ed8e340",
  },
};

serve(async (req) => {
  // Log request details for debugging
  console.log(`Received request: ${req.method} ${new URL(req.url).pathname}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
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
      console.log("Handling status request");
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
      console.log("Handling config request");
      return handleConfigRequest(req, url);
    } 
    // Proxy endpoint
    else if (endpoint === 'proxy') {
      console.log("Handling proxy request");
      return handleProxyRequest(req, url);
    } 
    // Legacy support for root path (assume proxy request)
    else if (endpoint === 'n8n-webhook-proxy') {
      console.log("Handling legacy proxy request");
      return handleProxyRequest(req, url);
    }
    // Unknown endpoint
    else {
      console.log(`Unknown endpoint: ${endpoint}`);
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
  
  // Add test-specific webhooks to the response
  const testWebhooks = {};
  if (env === "development") {
    for (const [type, environments] of Object.entries(webhookConfigs)) {
      if (environments["developmentTest"]) {
        testWebhooks[type] = environments["developmentTest"];
      }
    }
  }
  
  return new Response(
    JSON.stringify({
      environment: env,
      webhooks: webhookConfigs,
      currentWebhooks,
      testWebhooks,
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
  let payload, type, env, isTestMode = false, fileAnalysisStartPoint;
  
  // Check if parameters are in URL query params
  type = url.searchParams.get("type");
  env = url.searchParams.get("env");
  isTestMode = url.searchParams.get("isTestMode") === "true";
  fileAnalysisStartPoint = url.searchParams.get("file_analysis_start_point");
  
  try {
    // Try to get parameters from request body
    let body;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      body = await req.json();
      console.log("Received JSON payload:", body);
      
      // If body is an object with payload property, use that
      if (body && typeof body === "object") {
        if (body.payload) {
          payload = body.payload;
          console.log("Extracted payload from body.payload:", payload);
        } else {
          // Otherwise, use the entire body as payload
          payload = body;
          console.log("Using entire body as payload");
        }
        
        // If not in query params, try to get from body
        if (!type) type = body.type;
        if (!env) env = body.env;
        if (isTestMode === false) isTestMode = body.isTestMode === true;
        if (!fileAnalysisStartPoint) fileAnalysisStartPoint = body.file_analysis_start_point;
      } else {
        console.error("Invalid JSON body:", body);
        throw new Error("Invalid JSON body - expected an object");
      }
    } else {
      // For non-JSON content types, try to parse the body as text
      const textBody = await req.text();
      console.log("Received non-JSON body:", textBody);
      
      try {
        // Try to parse as JSON
        body = JSON.parse(textBody);
        payload = body.payload || body;
        if (!type) type = body.type;
        if (!env) env = body.env;
        if (isTestMode === false) isTestMode = body.isTestMode === true;
        if (!fileAnalysisStartPoint) fileAnalysisStartPoint = body.file_analysis_start_point;
      } catch (e) {
        console.error("Failed to parse body as JSON:", e);
        
        // If not valid JSON, use as-is for payload
        payload = { data: textBody };
      }
    }
    
    // If still no payload, return error
    if (!payload) {
      console.error("No payload found in request");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request - missing payload" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Add file_analysis_start_point to payload if it exists
    if (fileAnalysisStartPoint && typeof payload === 'object') {
      payload.file_analysis_start_point = fileAnalysisStartPoint;
      console.log(`Added file_analysis_start_point: ${fileAnalysisStartPoint} to payload`);
    }
  } catch (e) {
    console.error("Error processing request body:", e);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Error processing request: ${e.message}` 
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
  
  console.log(`Proxying ${type} request for ${env} environment. Test mode: ${isTestMode ? 'Yes' : 'No'}`);
  if (fileAnalysisStartPoint) {
    console.log(`File analysis start point: ${fileAnalysisStartPoint}`);
  }
  
  // Determine which webhook URL to use
  let webhookUrl;
  
  // Use test-specific webhook if in development environment and test mode is enabled
  if (env === "development" && isTestMode && webhookConfigs[type] && webhookConfigs[type]["developmentTest"]) {
    webhookUrl = webhookConfigs[type]["developmentTest"];
    console.log(`Using test-specific webhook URL for ${type} in development environment`);
  } else if (webhookConfigs[type] && webhookConfigs[type][env]) {
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
      
      // Try to get more details from the response
      let responseText;
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = "Could not read response body";
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to process webhook request",
          status: response.status,
          statusText: response.statusText,
          details: responseText
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
