
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { projectId } = await req.json();
    
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting deletion process for project ${projectId}`);
    
    // Delete associated files from storage buckets
    const deleteStorageFiles = async (bucketName: string) => {
      try {
        console.log(`Attempting to delete files from bucket: ${bucketName} for project: ${projectId}`);
        
        // List all files in the project folder
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(bucketName)
          .list(projectId, { 
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (listError) {
          console.error(`Error listing files in ${bucketName}/${projectId}:`, listError);
          throw new Error(`Failed to list files in ${bucketName}: ${listError.message}`);
        }

        if (files && files.length > 0) {
          console.log(`Found ${files.length} files in ${bucketName}/${projectId}`);
          
          // Create array of file paths to delete (include the project folder prefix)
          const filePaths = files.map(file => `${projectId}/${file.name}`);
          
          console.log(`Deleting files from ${bucketName}:`, filePaths);
          
          // Delete all files in the folder
          const { error: deleteError } = await supabaseAdmin.storage
            .from(bucketName)
            .remove(filePaths);

          if (deleteError) {
            console.error(`Error deleting files from ${bucketName}:`, deleteError);
            throw new Error(`Failed to delete files from ${bucketName}: ${deleteError.message}`);
          }

          console.log(`Successfully deleted ${filePaths.length} files from ${bucketName}/${projectId}`);
        } else {
          console.log(`No files found in ${bucketName}/${projectId}`);
        }
      } catch (error) {
        console.error(`Error processing ${bucketName} deletion:`, error);
        throw error;
      }
    };

    // Delete from both storage buckets - collect errors but don't fail the entire operation
    const storageErrors = [];
    
    try {
      await deleteStorageFiles('pub_images');
    } catch (error) {
      console.error('Failed to delete from pub_images:', error);
      storageErrors.push(`pub_images: ${error.message}`);
    }

    try {
      await deleteStorageFiles('pub_documents');
    } catch (error) {
      console.error('Failed to delete from pub_documents:', error);
      storageErrors.push(`pub_documents: ${error.message}`);
    }

    // Delete the project from the database
    // This will cascade delete related records (notes, files, reports, etc.) due to foreign key constraints
    console.log(`Deleting project ${projectId} from database`);
    
    const { error: dbError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (dbError) {
      throw new Error(`Failed to delete project from database: ${dbError.message}`);
    }

    console.log(`Successfully deleted project ${projectId} from database`);
    
    // Return success response with any storage warnings
    const response = {
      success: true,
      message: 'Project deleted successfully',
      storageWarnings: storageErrors.length > 0 ? storageErrors : null
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in delete-project function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
