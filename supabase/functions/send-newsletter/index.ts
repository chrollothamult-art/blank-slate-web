import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  subject: string;
  content: string;
  bookTitle?: string;
  bookDescription?: string;
  bookCoverUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Newsletter function invoked");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("Role check failed:", roleError);
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, content, bookTitle, bookDescription, bookCoverUrl }: NewsletterRequest = await req.json();
    console.log("Sending newsletter:", { subject, bookTitle });

    // Get all active subscribers
    const { data: subscribers, error: subError } = await supabaseClient
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      throw new Error("Failed to fetch subscribers");
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No active subscribers found");
      return new Response(JSON.stringify({ message: "No active subscribers", sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending to ${subscribers.length} subscribers`);

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">${subject}</h1>
          
          ${bookTitle ? `
            <div style="margin-bottom: 20px;">
              ${bookCoverUrl ? `<img src="${bookCoverUrl}" alt="${bookTitle}" style="max-width: 200px; border-radius: 4px; margin-bottom: 15px;" />` : ''}
              <h2 style="color: #333; font-size: 20px; margin-bottom: 10px;">${bookTitle}</h2>
              ${bookDescription ? `<p style="color: #666; line-height: 1.6;">${bookDescription}</p>` : ''}
            </div>
          ` : ''}
          
          <div style="color: #444; line-height: 1.8; white-space: pre-wrap;">${content}</div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            You received this email because you subscribed to ThouArt newsletter.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send emails in batches using Resend API directly
    const batchSize = 50;
    let sentCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const emails = batch.map(s => s.email);

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ThouArt <onboarding@resend.dev>",
            to: emails,
            subject: subject,
            html: emailHtml,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Batch send error:", errorData);
          errors.push(`Batch ${i / batchSize + 1}: ${errorData.message || "Unknown error"}`);
        } else {
          sentCount += emails.length;
          console.log(`Batch ${i / batchSize + 1} sent successfully`);
        }
      } catch (batchError: any) {
        console.error("Batch error:", batchError);
        errors.push(`Batch ${i / batchSize + 1}: ${batchError.message}`);
      }
    }

    console.log(`Newsletter sent to ${sentCount} subscribers`);

    return new Response(
      JSON.stringify({ 
        message: "Newsletter sent", 
        sent: sentCount,
        total: subscribers.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-newsletter function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
