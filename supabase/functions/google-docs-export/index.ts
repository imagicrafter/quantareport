
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { OAuth2Client } from 'https://deno.land/x/oauth2_client@v1.0.2/mod.ts';

// Get Supabase client with admin privileges
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Get Google OAuth configuration
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';

// Configure OAuth client
const oauth2Client = new OAuth2Client({
  clientId: googleClientId,
  clientSecret: googleClientSecret,
  authorizationEndpointUri: 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  redirectUri: '', // Will be provided by the client
});

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const requestData = await req.json();
    const { code, redirect_uri, report_id } = requestData;
    
    if (!code || !redirect_uri || !report_id) {
      console.error('Missing required parameters:', { code: !!code, redirect_uri: !!redirect_uri, report_id });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Processing export for report:', report_id);
    
    // Set the redirect URI
    oauth2Client.redirectUri = redirect_uri;
    
    // Exchange the code for access tokens
    const tokens = await oauth2Client.code.getToken(code);
    const accessToken = tokens.accessToken;
    
    // Fetch the report content from Supabase
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .single();
      
    if (reportError || !report) {
      console.error('Error fetching report:', reportError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch report data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a new Google Doc
    const createDocResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: report.title || 'Untitled Report'
      })
    });
    
    if (!createDocResponse.ok) {
      const errorData = await createDocResponse.text();
      console.error('Error creating Google Doc:', errorData);
      throw new Error(`Failed to create Google Doc: ${errorData}`);
    }
    
    const docData = await createDocResponse.json();
    const documentId = docData.documentId;
    
    // Convert HTML content to Google Docs format
    // This is a simplified version - a full implementation would need to parse HTML properly
    let plainTextContent = report.content
      ? report.content.replace(/<[^>]*>/g, '') // Remove HTML tags
                     .replace(/&nbsp;/g, ' ')  // Replace HTML entities
      : 'No content';
      
    // Prepare batch update to insert content
    const batchUpdateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: plainTextContent
            }
          }
        ]
      })
    });
    
    if (!batchUpdateResponse.ok) {
      const errorData = await batchUpdateResponse.text();
      console.error('Error updating Google Doc content:', errorData);
      throw new Error(`Failed to update Google Doc content: ${errorData}`);
    }
    
    // Get the document URL for the user to access
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    
    // Update the report in Supabase with the Google Doc URL
    await supabaseClient
      .from('reports')
      .update({ 
        doc_url: documentUrl,
        last_edited_at: new Date().toISOString()
      })
      .eq('id', report_id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId, 
        documentUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error exporting to Google Docs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to export to Google Docs' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
