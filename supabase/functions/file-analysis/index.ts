import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Get n8n webhook URLs from environment variables with fallbacks
const DEV_FILE_ANALYSIS_WEBHOOK_URL = Deno.env.get("DEV_FILE_ANALYSIS_WEBHOOK_URL") || 
  "https://n8n-01.imagicrafterai.com/webhook-test/7981ebe6-58f6-4b8f-9fdb-0e7b2e1020f0";
const PROD_FILE_ANALYSIS_WEBHOOK_URL = Deno.env.get("PROD_FILE_ANALYSIS_WEBHOOK_URL") || 
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
    
    // Check if this is a progress update from n8n workflow
    if (requestData.status && requestData.job && requestData.progress !== undefined) {
      return await handleProgressUpdate(requestData);
    }
    
    // Otherwise, treat it as a file analysis request
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
    
    console.log(`Starting file analysis for project: ${project_id}`);
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
    
    // Create a callback URL for the n8n workflow to send progress updates
    const jobId = job || crypto.randomUUID(); // Use provided job ID or generate a new one
    
    // Use the current function URL as callback to simplify n8n configuration
    const callbackUrl = `${Deno.env.get("SUPABASE_URL") || "https://vtaufnxworztolfdwlll.supabase.co"}/functions/v1/file-analysis`;
    
    console.log(`Using callback URL: ${callbackUrl}`);
    
    // Prepare webhook payload
    const webhookUrl = isTestMode ? DEV_FILE_ANALYSIS_WEBHOOK_URL : PROD_FILE_ANALYSIS_WEBHOOK_URL;
    const payload = {
      project_id,
      files: fileDetails,
      job: jobId,
      timestamp: new Date().toISOString(),
      callback_url: callbackUrl // Include callback URL in the payload
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
          error: "Error calling file analysis webhook", 
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
    
    // Create initial progress record
    const { error: progressError } = await supabase
      .from("report_progress")
      .insert({
        job: jobId,
        status: "generating",
        message: "Starting file analysis...",
        progress: 5
      });
      
    if (progressError) {
      console.error("Error creating initial progress record:", progressError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "File analysis initiated successfully",
        jobId: jobId,
        fileCount: unprocessedFiles.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// Helper function to handle progress updates from n8n
async function handleProgressUpdate(data: any) {
  console.log("Handling progress update:", JSON.stringify(data));
  
  try {
    // Validate required fields
    if (!data.job) {
      console.error("Missing 'job' field in progress update");
      return new Response(
        JSON.stringify({ error: "Missing required field: job" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Map status from n8n to our application status
    let appStatus: "idle" | "generating" | "completed" | "error" = "generating";
    
    if (data.status === "completed") {
      appStatus = "completed";
    } else if (data.status === "error") {
      appStatus = "error";
    }
    
    // Create Supabase client for progress update
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Prepare the data to insert
    const insertData = {
      status: appStatus,
      message: data.message || "Processing files...",
      progress: parseInt(String(data.progress), 10) || 0,
      job: data.job
    };
    
    console.log("Inserting progress record:", insertData);
    
    // Insert the progress update into the database
    const { data: progressData, error: progressError } = await supabase
      .from("report_progress")
      .insert(insertData)
      .select();
      
    if (progressError) {
      console.error("Error inserting progress update:", progressError);
      return new Response(
        JSON.stringify({ error: "Failed to save progress update", details: progressError.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    console.log("Progress update saved successfully");
    
    // If status is completed, remove processed files from files_not_processed
    if (appStatus === "completed" && data.project_id) {
      try {
        const { error: cleanupError } = await supabase
          .from("files_not_processed")
          .delete()
          .eq("project_id", data.project_id);
          
        if (cleanupError) {
          console.error("Error cleaning up processed files:", cleanupError);
        } else {
          console.log(`Cleaned up processed files for project ${data.project_id}`);
        }
      } catch (cleanupErr) {
        console.error("Exception during cleanup:", cleanupErr);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Progress update received",
        data: progressData
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error handling progress update:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
}
