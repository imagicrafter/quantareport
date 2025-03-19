
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
  defaults: {
    scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file',
  },
});

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { redirect_uri } = await req.json();
    
    if (!redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'Missing redirect_uri parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Set the redirect URI
    oauth2Client.redirectUri = redirect_uri;
    
    // Generate authorization URL
    const authUrl = await oauth2Client.code.getAuthorizationUri({
      scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file',
      state: 'exporttogoogledocs', // Custom state for verification
      access_type: 'offline',
      prompt: 'consent',
    });
    
    return new Response(
      JSON.stringify({ url: authUrl.toString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate OAuth URL' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
