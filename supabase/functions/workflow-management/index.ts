
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { operation, projectId, userId, workflowState } = await req.json()

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let result = null
    let error = null

    switch (operation) {
      case 'get':
        const { data: existingWorkflow, error: getError } = await supabaseClient
          .from('project_workflow')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle()

        result = existingWorkflow
        error = getError
        break

      case 'insert':
        if (!userId || !workflowState) {
          return new Response(
            JSON.stringify({ error: 'User ID and workflow state are required for insert' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const { data: insertData, error: insertError } = await supabaseClient
          .from('project_workflow')
          .insert({
            project_id: projectId,
            user_id: userId,
            workflow_state: workflowState
          })
          .select()
          .single()

        result = insertData
        error = insertError
        break

      case 'update':
        if (!workflowState) {
          return new Response(
            JSON.stringify({ error: 'Workflow state is required for update' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // First check if a record exists
        const { data: existingRecord } = await supabaseClient
          .from('project_workflow')
          .select('id')
          .eq('project_id', projectId)
          .maybeSingle()

        if (existingRecord) {
          // Update existing record
          const { data: updateData, error: updateError } = await supabaseClient
            .from('project_workflow')
            .update({ workflow_state: workflowState })
            .eq('project_id', projectId)
            .select()
            .single()

          result = updateData
          error = updateError
        } else if (userId) {
          // Create new record if it doesn't exist
          const { data: insertData, error: insertError } = await supabaseClient
            .from('project_workflow')
            .insert({
              project_id: projectId,
              user_id: userId,
              workflow_state: workflowState
            })
            .select()
            .single()

          result = insertData
          error = insertError
        } else {
          error = { message: 'User ID required to create workflow state' }
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
