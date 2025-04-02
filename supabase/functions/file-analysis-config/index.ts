
/**
 * Edge function to provide webhook configuration for file analysis
 * This allows us to retrieve the configuration from Supabase secrets
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Environment types
type Environment = "development" | "staging" | "production";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get environment from query parameters
    const url = new URL(req.url);
    const env = url.searchParams.get("env") as Environment || "production";
    
    // Get webhook URLs from environment variables
    const webhooks = {
      "file-analysis": {
        development: Deno.env.get("DEV_FILE_ANALYSIS_WEBHOOK_URL") || 
          "https://n8n-01.imagicrafterai.com/webhook-test/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
        staging: Deno.env.get("STAGING_FILE_ANALYSIS_WEBHOOK_URL") || 
          "https://n8n-01.imagicrafterai.com/webhook-staging/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0",
        production: Deno.env.get("PROD_FILE_ANALYSIS_WEBHOOK_URL") || 
          "https://n8n-01.imagicrafterai.com/webhook/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0"
      },
      report: {
        development: Deno.env.get("DEV_REPORT_WEBHOOK_URL") || 
          "https://n8n-01.imagicrafterai.com/webhook-test/785af48f-c1b1-484e-8bea-21920dee1146",
        staging: Deno.env.get("STAGING_REPORT_WEBHOOK_URL") || 
          "https://n8n-01.imagicrafterai.com/webhook-staging/785af48f-c1b1-484e-8bea-21920dee1146",
        production: Deno.env.get("PROD_REPORT_WEBHOOK_URL") || 
          "https://n8n-01.imagicrafterai.com/webhook/785af48f-c1b1-484e-8bea-21920dee1146"
      },
      note: {
        development: Deno.env.get("DEV_NOTE_WEBHOOK_URL") || 
          "https://vtaufnxworztolfdwlll.supabase.co/functions/v1/n8n-proxy?env=dev",
        staging: Deno.env.get("STAGING_NOTE_WEBHOOK_URL") || 
          "https://vtaufnxworztolfdwlll.supabase.co/functions/v1/n8n-proxy?env=staging",
        production: Deno.env.get("PROD_NOTE_WEBHOOK_URL") || 
          "https://vtaufnxworztolfdwlll.supabase.co/functions/v1/n8n-proxy?env=prod"
      }
    };

    // Return the webhook URL for the specified environment
    return new Response(
      JSON.stringify({
        environment: env,
        webhooks: webhooks,
        currentWebhooks: {
          "file-analysis": webhooks["file-analysis"][env],
          report: webhooks.report[env],
          note: webhooks.note[env]
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error processing webhook config request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
