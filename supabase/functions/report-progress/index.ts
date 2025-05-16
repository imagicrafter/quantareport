
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  console.log("Edge function received request:", req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Get the report ID from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    let reportId = pathParts[pathParts.length - 1];
    
    console.log(`Found report ID in URL path: ${reportId}`);
    
    // If the request is POST, also check for report_id in the body
    let requestBody = {};
    if (req.method === "POST") {
      requestBody = await req.json().catch(err => {
        console.error("Error parsing request body:", err);
        return {};
      });
      
      // If report_id is in the body and not in the URL path, use the one from the body
      if (requestBody.report_id && (reportId === "report-progress" || !reportId)) {
        reportId = requestBody.report_id;
        console.log(`Using report ID from request body: ${reportId}`);
      }
    }
    
    if (!reportId || reportId === "report-progress") {
      console.error("No report ID provided in URL path or request body");
      return new Response(
        JSON.stringify({ error: "Report ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    console.log(`Processing request for report ID: ${reportId}`);
    
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
    
    // Check if this is a GET or POST request
    let progressData: any;
    
    if (req.method === "GET") {
      console.log("Processing GET request");
      // For GET requests, extract data from query parameters
      const params = url.searchParams;
      let progress = params.get("progress") || "0";
      let job = params.get("job") || null;
      
      // Strip percentage sign if present and convert to integer
      if (typeof progress === "string") {
        progress = progress.replace(/%/g, "");
      }
      
      progressData = {
        status: params.get("status") || "generating",
        message: params.get("message") || "Processing report...",
        progress: parseInt(progress, 10),
        job: job
      };
      console.log("GET request progress data:", progressData);
    } else if (req.method === "POST") {
      console.log("Processing POST request");
      // We've already parsed the body earlier to extract potential report_id
      const body = requestBody;
      
      if (!body || Object.keys(body).length === 0) {
        console.error("Empty or invalid request body");
        return new Response(
          JSON.stringify({ error: "Invalid request body" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
      
      // Handle progress as string or number
      let progress = body.progress || 0;
      
      // Strip percentage sign if present and convert to integer
      if (typeof progress === "string") {
        progress = progress.replace(/%/g, "");
        progress = parseInt(progress, 10);
      }
      
      progressData = {
        status: body.status || "generating",
        message: body.message || "Processing report...",
        progress: progress,
        job: body.job || null
      };
      console.log("POST request progress data:", progressData);
      
      // If the status is 'completed', update the report content if provided
      if (progressData.status === "completed" && body.content) {
        console.log("Updating report content for completed status");
        // Update the report content
        const { error: updateError } = await supabase
          .from("reports")
          .update({ 
            content: body.content,
            last_edited_at: new Date().toISOString()
          })
          .eq("id", reportId);
          
        if (updateError) {
          console.error("Error updating report content:", updateError);
        }
      }
    } else {
      console.error("Unsupported method:", req.method);
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 405 
        }
      );
    }
    
    // Map status from n8n to our application status
    let appStatus: "idle" | "generating" | "completed" | "error" = "generating";
    
    if (progressData.status === "completed") {
      appStatus = "completed";
    } else if (progressData.status === "error") {
      appStatus = "error";
    }
    
    console.log("Inserting progress update with app status:", appStatus);
    
    // Prepare the data to insert, including job field if present
    const insertData = {
      report_id: reportId,
      status: appStatus,
      message: progressData.message,
      progress: progressData.progress
    };
    
    // Add job field only if it's provided and not null
    if (progressData.job) {
      console.log(`Using job UUID: ${progressData.job}`);
      Object.assign(insertData, { job: progressData.job });
    }
    
    // Insert the progress update into the database
    const { data, error } = await supabase
      .from("report_progress")
      .insert(insertData)
      .select();
      
    if (error) {
      console.error("Error inserting progress update:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save progress update", details: error.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    console.log("Progress update saved successfully");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Progress update received",
        data
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error processing progress update:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
