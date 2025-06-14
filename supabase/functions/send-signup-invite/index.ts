
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { 
      signupCode, 
      recipientEmail, 
      recipientEmails, 
      prospectData, 
      emailType, 
      confirmationLink 
    } = await req.json();

    console.log("Request data:", { signupCode, recipientEmail, hasRecipients: !!recipientEmails, hasProspectData: !!prospectData, emailType, hasConfirmationLink: !!confirmationLink });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const mailjetApiKey = Deno.env.get("MAILJET_API_KEY");
    const mailjetApiSecret = Deno.env.get("MAILJET_API_SECRET");
    const mailjetSenderEmail = Deno.env.get("MAILJET_SENDER_EMAIL") || "noreply@example.com";
    const mailjetSenderName = Deno.env.get("MAILJET_SENDER_NAME") || "QuantaReport";
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://quantareport.com";

    if (!mailjetApiKey || !mailjetApiSecret) {
      console.warn("MailJet API keys not configured. Skipping email sending.");
      return new Response(JSON.stringify({ success: true, message: "Email sending skipped due to missing configuration." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    let emailHTML = "";
    let emailSubject = "";
    let effectiveRecipients = recipientEmails || (recipientEmail ? [recipientEmail] : []);

    const effectiveEmailType = emailType || (confirmationLink ? 'CONFIRMATION' : (signupCode === 'PROSPECT_NOTIFICATION' ? 'PROSPECT' : 'INVITE'));

    switch(effectiveEmailType) {
      case 'PROSPECT':
        if (!prospectData) throw new Error("Prospect data is missing.");
        emailSubject = "New Prospect Signup - QuantaReport";
        emailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .prospect-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; color: #333; }
              .value { color: #666; }
              .footer { font-size: 12px; color: #6c757d; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Prospect Signup</h2>
              </div>
              <div class="content">
                <p>A new prospect has signed up for QuantaReport:</p>
                <div class="prospect-info">
                  <div class="info-row"><span class="label">Email:</span> <span class="value">${prospectData.email}</span></div>
                  <div class="info-row"><span class="label">Name:</span> <span class="value">${prospectData.name}</span></div>
                  <div class="info-row"><span class="label">Company:</span> <span class="value">${prospectData.company}</span></div>
                  <div class="info-row"><span class="label">Interest Area:</span> <span class="value">${prospectData.interest_area}</span></div>
                  <div class="info-row"><span class="label">Source:</span> <span class="value">${prospectData.source}</span></div>
                </div>
                <p>You can view and manage this prospect in the admin panel.</p>
                <div class="footer"><p>This is an automated notification from QuantaReport.</p></div>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'CONFIRMATION':
        if (!confirmationLink || !recipientEmail) throw new Error("Confirmation link or recipient email is missing.");
        effectiveRecipients = [recipientEmail];
        emailSubject = "Confirm your QuantaReport Account";
        emailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { font-size: 12px; color: #6c757d; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h2>Confirm your account on QuantaReport</h2></div>
              <div class="content">
                <p>Hello,</p>
                <p>Thanks for signing up for QuantaReport! Please click the button below to confirm your email address and activate your account:</p>
                <p><a href="${confirmationLink}" class="button">Confirm Email Address</a></p>
                <p>Or copy and paste this URL into your browser:</p>
                <p>${confirmationLink}</p>
                <div class="footer"><p>If you didn't create an account, you can ignore this email.</p></div>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'INVITE':
      default:
        if (!signupCode || !recipientEmail) throw new Error("Signup code or recipient email is missing.");
        effectiveRecipients = [recipientEmail];
        const signupUrl = `${frontendUrl}/signup?code=${signupCode}&email=${encodeURIComponent(recipientEmail)}`;
        emailSubject = "Invitation to join QuantaReport";
        emailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { font-size: 12px; color: #6c757d; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h2>You've been invited to join QuantaReport</h2></div>
              <div class="content">
                <p>Hello,</p>
                <p>You have been invited to create an account on QuantaReport. Click the button below to sign up:</p>
                <p><a href="${signupUrl}" class="button">Create Your Account</a></p>
                <p>Or copy and paste this URL into your browser:</p>
                <p>${signupUrl}</p>
                <p>Your signup code is: <strong>${signupCode}</strong></p>
                <div class="footer"><p>If you didn't expect this invitation, you can ignore this email.</p></div>
              </div>
            </div>
          </body>
          </html>
        `;
        break;
    }
    
    for (const email of effectiveRecipients) {
      console.log(`Sending '${effectiveEmailType}' email to:`, email);
      const mailjetPayload = {
        Messages: [{
          From: { Email: mailjetSenderEmail, Name: mailjetSenderName },
          To: [{ Email: email, Name: email.split("@")[0] }],
          Subject: emailSubject,
          HTMLPart: emailHTML
        }]
      };

      const authHeader = "Basic " + btoa(`${mailjetApiKey}:${mailjetApiSecret}`);

      const mailjetResponse = await fetch("https://api.mailjet.com/v3.1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify(mailjetPayload)
      });

      const mailjetResponseData = await mailjetResponse.json();
      if (!mailjetResponse.ok) {
        throw new Error(`MailJet API error for ${email}: ${JSON.stringify(mailjetResponseData)}`);
      }
      console.log(`Email sent successfully to ${email} via MailJet API.`);
    }

    if (effectiveEmailType === 'INVITE') {
      const { error: updateError } = await supabase.from('signup_codes').update({
        last_invited_at: new Date().toISOString()
      }).eq('code', signupCode).eq('email', recipientEmail);
      if (updateError) {
        console.error("Error updating signup code:", updateError);
        throw updateError;
      }
    }

    console.log("Process completed successfully");
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-signup-invite function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
