
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("SUPABASE_AUTH_WEBHOOK_SECRET");

  if (!supabaseUrl || !supabaseServiceKey || !webhookSecret) {
    console.error("Missing required environment variables.");
    return new Response("Internal Server Error: Missing configuration.", { status: 500 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(webhookSecret);
    const verifiedPayload = wh.verify(payload, headers) as any;

    console.log(`Received webhook: ${verifiedPayload.type}`);

    if (verifiedPayload.type === 'user.signedup' || verifiedPayload.data.email_action_type === 'signup') {
      const user = verifiedPayload.data.user;
      const email_data = verifiedPayload.data.email_data;

      if (!user || !email_data) {
        throw new Error("Invalid payload structure for signup event.");
      }

      const { token_hash, redirect_to } = email_data;
      const siteUrl = Deno.env.get("FRONTEND_URL") || "https://quantareport.com";
      const confirmationLink = `${siteUrl}/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${redirect_to}`;
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error: invokeError } = await supabaseAdmin.functions.invoke('send-signup-invite', {
        body: {
          emailType: 'CONFIRMATION',
          recipientEmail: user.email,
          confirmationLink: confirmationLink
        }
      });

      if (invokeError) {
        throw invokeError;
      }

      console.log(`Confirmation email queued for ${user.email}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
