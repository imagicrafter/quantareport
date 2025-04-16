import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Get n8n webhook URLs from environment variables with fallbacks
// We'll keep these but enhance with a more flexible system
const DEV_FILE_ANALYSIS_WEBHOOK_URL = Deno.env.get("DEV_FILE_ANALYSIS_WEBHOOK_URL") || 
  "https://n8n-01.imagicrafterai.com/webhook-test/d42cb7ac-c4e1-4f0e-a084-0f6f85807b65";
const PROD_FILE_ANALYSIS_WEBHOOK_URL = Deno.env.get("PROD_FILE_ANALYSIS_WEBHOOK_URL") || 
  "https://n8n-01.imagicrafterai.com/webhook/d42cb7ac-c4e1-4f0e-a084-0f6f85807b65";

// New function to get webhook URL based on environment
const getWebhookUrl = async (env: string): Promise<string> => {
  // Try to get webhook URL from config endpoint first
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const response = await fetch(`${supabaseUrl}/functions/v1/file-analysis-config?env=${env}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.currentWebhooks["file-analysis"];
    }
  } catch (error) {
    console.error("Error fetching webhook config, using fallback:", error);
  }
  
  // Fallback to environment variables or defaults
  if (env === "development" || env === "dev" || env === "test") {
    return DEV_FILE_ANALYSIS_WEBHOOK_URL;
  } else {
    return PROD_FILE_ANALYSIS_WEBHOOK_URL;
  }
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
    // Parse request body
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    // Check if this is a progress update from n8n workflow
    if (requestData.status && requestData.job && requestData.progress !== undefined) {
      return await handleProgressUpdate(requestData);
    }
    
    // Otherwise, treat it as a file analysis request
    const { project_id, user_id, isTestMode = false, job = null } = requestData;
    
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
    
    if (!user_id) {
      console.error("No user_id provided in request body");
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    console.log(`Starting file analysis for project: ${project_id}, user: ${user_id}`);
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
      
      // Create a completed progress update to close the dialog
      if (job) {
        const { error: progressError } = await supabase
          .from("report_progress")
          .insert({
            job: job,
            status: "completed",
            message: "No files to process",
            progress: 100
          });
          
        if (progressError) {
          console.error("Error creating completion progress record:", progressError);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "No unprocessed files found for this project",
          jobId: job
        }),
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
    const callbackUrl = `${supabaseUrl}/functions/v1/file-analysis`;
    
    console.log(`Using callback URL: ${callbackUrl}`);
    
    // Get project details to determine environment from name
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("name")
      .eq("id", project_id)
      .single();
      
    if (projectError) {
      console.error("Error fetching project details:", projectError);
    }
    
    // Determine environment based on project name or isTestMode flag
    const projectName = project?.name || "";
    const isDevEnvironment = isTestMode || projectName.toLowerCase().includes("test");
    const environment = isDevEnvironment ? "development" : "production";
    
    // Determine webhook URL based on environment
    const webhookUrl = await getWebhookUrl(environment);
    console.log(`Using webhook URL for ${environment} environment: ${webhookUrl}`);
    
    // Create initial progress record if not already created by client
    if (jobId) {
      const { data: existingProgress, error: checkError } = await supabase
        .from("report_progress")
        .select("*")
        .eq("job", jobId)
        .limit(1);
        
      if (!checkError && (!existingProgress || existingProgress.length === 0)) {
        const { error: progressError } = await supabase
          .from("report_progress")
          .insert({
            job: jobId,
            status: "generating",
            message: "Preparing files for analysis...",
            progress: 10
          });
          
        if (progressError) {
          console.error("Error creating initial progress record:", progressError);
        } else {
          console.log("Created initial progress record for job:", jobId);
        }
      }
    }
    
    // Prepare webhook payload
    const payload = {
      project_id,
      user_id,
      files: fileDetails,
      job: jobId,
      timestamp: new Date().toISOString(),
      callback_url: callbackUrl,
      environment: environment,
      total_files: unprocessedFiles.length
    };
    
    console.log(`Sending request to webhook: ${webhookUrl}`);
    console.log("Webhook payload:", JSON.stringify(payload));
    
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
      
      // Update progress to show error
      if (jobId) {
        const { error: progressError } = await supabase
          .from("report_progress")
          .insert({
            job: jobId,
            status: "error",
            message: "Failed to start analysis process",
            progress: 0
          });
          
        if (progressError) {
          console.error("Error creating error progress record:", progressError);
        }
      }
      
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
    
    // Update progress after successful webhook call
    if (jobId) {
      const { error: progressError } = await supabase
        .from("report_progress")
        .insert({
          job: jobId,
          status: "generating",
          message: "Analysis started",
          progress: 15
        });
        
      if (progressError) {
        console.error("Error creating progress record after webhook:", progressError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "File analysis initiated successfully",
        jobId: jobId,
        fileCount: unprocessedFiles.length,
        environment: environment
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
        console.log(`Completing file analysis for project ${data.project_id}`);
        
        // Create a final progress update with 100%
        const { error: finalUpdateError } = await supabase
          .from("report_progress")
          .insert({
            status: "completed",
            message: "Analysis completed successfully",
            progress: 100,
            job: data.job
          });
          
        if (finalUpdateError) {
          console.error("Error creating final progress update:", finalUpdateError);
        }
        
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
