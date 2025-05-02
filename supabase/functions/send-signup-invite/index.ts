
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400"
};

serve(async (req) => {
  console.log("Request received:", req.method);

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log("Parsing request body");
    const { signupCode, recipientEmail } = await req.json();
    console.log("Request data:", {
      signupCode,
      recipientEmail
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get MailJet API configuration
    const mailjetApiKey = Deno.env.get("MAILJET_API_KEY");
    const mailjetApiSecret = Deno.env.get("MAILJET_API_SECRET");
    const mailjetSenderEmail = Deno.env.get("MAILJET_SENDER_EMAIL") || "noreply@example.com";
    const mailjetSenderName = Deno.env.get("MAILJET_SENDER_NAME") || "QuantaReport";
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://staging.quantareport.com";
    
    const signupUrl = `${frontendUrl}/signup?code=${signupCode}&email=${encodeURIComponent(recipientEmail)}`;

    console.log("Email configuration:", {
      hasMailjetApiKey: !!mailjetApiKey,
      hasMailjetApiSecret: !!mailjetApiSecret,
      mailjetSenderEmail,
      mailjetSenderName,
      frontendUrl,
      signupUrl
    });

    if (mailjetApiKey && mailjetApiSecret) {
      try {
        // Build the HTML email template
        const emailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .button { 
                display: inline-block; 
                padding: 10px 20px; 
                background-color: #4CAF50; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { font-size: 12px; color: #6c757d; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>You've been invited to join QuantaReport</h2>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>You have been invited to create an account on QuantaReport. Click the button below to sign up:</p>
                <p><a href="${signupUrl}" class="button">Create Your Account</a></p>
                <p>Or copy and paste this URL into your browser:</p>
                <p>${signupUrl}</p>
                <p>Your signup code is: <strong>${signupCode}</strong></p>
                <div class="footer">
                  <p>If you didn't expect this invitation, you can ignore this email.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        console.log("Sending email to:", recipientEmail);
        
        // Prepare the MailJet API request payload
        const mailjetPayload = {
          Messages: [
            {
              From: {
                Email: mailjetSenderEmail,
                Name: mailjetSenderName
              },
              To: [
                {
                  Email: recipientEmail,
                  Name: recipientEmail.split("@")[0] // Simple name from email
                }
              ],
              Subject: "Invitation to join QuantaReport",
              HTMLPart: emailHTML
            }
          ]
        };

        // Encode API credentials for Basic Authentication
        const authHeader = "Basic " + btoa(`${mailjetApiKey}:${mailjetApiSecret}`);

        // Send email using MailJet API
        const mailjetResponse = await fetch("https://api.mailjet.com/v3.1/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader
          },
          body: JSON.stringify(mailjetPayload)
        });

        const mailjetResponseData = await mailjetResponse.json();

        if (!mailjetResponse.ok) {
          throw new Error(`MailJet API error: ${JSON.stringify(mailjetResponseData)}`);
        }

        console.log("Email sent successfully via MailJet API:", mailjetResponseData);
      } catch (emailError) {
        console.error("MailJet API error:", emailError);
        throw new Error(`Email sending failed: ${emailError.message}`);
      }
    } else {
      console.log("MailJet API not configured properly. Email would be sent to:", recipientEmail);
      console.log("Signup URL:", signupUrl);
    }

    // Update the last_invited_at timestamp
    console.log("Updating last_invited_at for signup code:", signupCode);
    const { error: updateError } = await supabase.from('signup_codes').update({
      last_invited_at: new Date().toISOString()
    }).eq('code', signupCode).eq('email', recipientEmail);

    if (updateError) {
      console.error("Error updating signup code:", updateError);
      throw updateError;
    }

    console.log("Invitation process completed successfully");
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("Error in send-signup-invite function:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
