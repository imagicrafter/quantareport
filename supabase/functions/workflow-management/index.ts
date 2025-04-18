
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Create a single supabase client for interacting with your database
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log the deprecation access
    console.warn("DEPRECATED FUNCTION ACCESSED: workflow-management - This function has been deprecated and will be removed. Workflow state is now managed directly through Supabase client operations on the project_workflow table.");
    
    const requestData = await req.json();
    console.log("Deprecated workflow-management accessed with request data:", JSON.stringify(requestData));

    // Return a deprecation notice
    return new Response(
      JSON.stringify({ 
        error: "DEPRECATED ENDPOINT", 
        message: "This endpoint has been deprecated and will be removed soon. Workflow state is now managed directly through Supabase client operations on the project_workflow table.",
        alternativeApproach: "Use direct Supabase client operations on the project_workflow table."
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 410 // Gone
      }
    )
  } catch (error) {
    console.error(`Error in deprecated workflow-management function: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: "DEPRECATED ENDPOINT", 
        message: "This endpoint has been deprecated and will be removed soon. Workflow state is now managed directly through Supabase client operations on the project_workflow table.",
        parseError: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 410 // Gone 
      }
    )
  }
})
