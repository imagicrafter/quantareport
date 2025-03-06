
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Get the report ID from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const reportId = pathParts[pathParts.length - 1];
    
    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "Report ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if this is a GET or POST request
    let progressData: any;
    
    if (req.method === "GET") {
      // For GET requests, extract data from query parameters
      const params = url.searchParams;
      progressData = {
        status: params.get("status") || "generating",
        message: params.get("message") || "Processing report...",
        progress: parseInt(params.get("progress") || "0", 10)
      };
    } else if (req.method === "POST") {
      // For POST requests, extract data from request body
      const body = await req.json();
      progressData = {
        status: body.status || "generating",
        message: body.message || "Processing report...",
        progress: body.progress || 0
      };
      
      // If the status is 'completed', update the report content if provided
      if (progressData.status === "completed" && body.content) {
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
    
    // Insert the progress update into the database
    const { data, error } = await supabase
      .from("report_progress")
      .insert({
        report_id: reportId,
        status: appStatus,
        message: progressData.message,
        progress: progressData.progress
      })
      .select();
      
    if (error) {
      console.error("Error inserting progress update:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save progress update" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
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
      JSON.stringify({ error: "Internal server error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
