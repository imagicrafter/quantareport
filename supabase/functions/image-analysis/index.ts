
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Get n8n webhook URLs from environment variables with fallbacks
const DEV_IMAGE_ANALYSIS_WEBHOOK_URL = Deno.env.get("DEV_IMAGE_ANALYSIS_WEBHOOK_URL") || 
  "https://n8n-01.imagicrafterai.com/webhook-test/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0";
const PROD_IMAGE_ANALYSIS_WEBHOOK_URL = Deno.env.get("PROD_IMAGE_ANALYSIS_WEBHOOK_URL") || 
  "https://n8n-01.imagicrafterai.com/webhook/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0";

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
    // Parse request body
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { project_id, isTestMode = false, job = null } = requestData;
    
    if (!project_id) {
      console.error("No project_id provided in request body");
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    console.log(`Starting image analysis for project: ${project_id}`);
    console.log(`Using ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    console.log("Creating Supabase client");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get unprocessed files for the project
    const { data: unprocessedFiles, error: filesError } = await supabase
      .from("files_not_processed")
      .select("*")
      .eq("project_id", project_id);
      
    if (filesError) {
      console.error("Error fetching unprocessed files:", filesError);
      return new Response(
        JSON.stringify({ error: "Error fetching unprocessed files", details: filesError.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    if (!unprocessedFiles || unprocessedFiles.length === 0) {
      console.log("No unprocessed files found for this project");
      return new Response(
        JSON.stringify({ message: "No unprocessed files found for this project" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    console.log(`Found ${unprocessedFiles.length} unprocessed files`);
    
    // Prepare file paths for n8n webhook
    const fileDetails = unprocessedFiles.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      file_path: file.file_path
    }));
    
    // Prepare webhook payload
    const webhookUrl = isTestMode ? DEV_IMAGE_ANALYSIS_WEBHOOK_URL : PROD_IMAGE_ANALYSIS_WEBHOOK_URL;
    const payload = {
      project_id,
      files: fileDetails,
      job: job || crypto.randomUUID(), // Use provided job ID or generate a new one
      timestamp: new Date().toISOString()
    };
    
    console.log(`Sending request to webhook: ${webhookUrl}`);
    
    // Send request to n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`Webhook error (${webhookResponse.status}): ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: "Error calling image analysis webhook", 
          status: webhookResponse.status,
          details: errorText
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    const webhookData = await webhookResponse.json();
    console.log("Webhook response:", JSON.stringify(webhookData));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Image analysis initiated successfully",
        jobId: payload.job,
        fileCount: unprocessedFiles.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error processing image analysis request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
