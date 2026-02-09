import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  userId: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, userId } = (await req.json()) as RequestBody;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user's message
    const userMessage = messages[messages.length - 1];

    // Search almanac for relevant entries
    const { data: characters } = await supabase
      .from("almanac_characters")
      .select("name, description, role, affiliation, species")
      .ilike("name", `%${userMessage.content}%`)
      .limit(3);

    const { data: locations } = await supabase
      .from("almanac_locations")
      .select("name, description, kingdom, location_type")
      .ilike("name", `%${userMessage.content}%`)
      .limit(3);

    const { data: races } = await supabase
      .from("almanac_races")
      .select("name, description, homeland, population")
      .ilike("name", `%${userMessage.content}%`)
      .limit(3);

    const { data: relics } = await supabase
      .from("almanac_relics")
      .select("name, description, power_level, type")
      .ilike("name", `%${userMessage.content}%`)
      .limit(3);

    // Build context from matched entries
    const context = [
      ...(characters || []).map(
        (c) => `Character: ${c.name} (${c.species})\nRole: ${c.role}\nAffiliation: ${c.affiliation}\nDescription: ${c.description}`
      ),
      ...(locations || []).map(
        (l) =>
          `Location: ${l.name} (${l.location_type})\nKingdom: ${l.kingdom}\nDescription: ${l.description}`
      ),
      ...(races || []).map(
        (r) =>
          `Race: ${r.name}\nHomeland: ${r.homeland}\nPopulation: ${r.population}\nDescription: ${r.description}`
      ),
      ...(relics || []).map(
        (r) =>
          `Relic: ${r.name}\nPower Level: ${r.power_level}\nType: ${r.type}\nDescription: ${r.description}`
      ),
    ].join("\n\n");

    // Build system prompt with lore context
    const systemPrompt = `You are the Keeper of Lore for the ThouArt universe. You answer questions about the world, its inhabitants, locations, magic, and history using ONLY the provided lore entries. 

If the answer isn't in the provided lore, say so and suggest related topics you DO know about.

Always be helpful, maintain the mystical tone of the world, and cite which lore entries you're drawing from.

Available lore context:
${context || "No specific lore matches found. Speaking from general knowledge of the ThouArt universe."}`;

    // Call Lovable AI Gateway
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("AI Gateway error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate response from AI",
          details: error,
        }),
        { status: response.status, headers: corsHeaders }
      );
    }

    const aiResponse = await response.json();
    const assistantMessage =
      aiResponse.choices[0]?.message?.content || "I'm unable to answer that.";

    // Save conversation history
    if (userId) {
      const { data: existing } = await supabase
        .from("rp_lore_conversations")
        .select("*")
        .eq("user_id", userId)
        .single();

      const updatedMessages: Message[] = [
        ...(existing?.messages || []),
        userMessage,
        { role: "assistant", content: assistantMessage },
      ];

      if (existing) {
        await supabase
          .from("rp_lore_conversations")
          .update({
            messages: updatedMessages.slice(-20), // Keep last 20 messages
            last_active_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("rp_lore_conversations").insert({
          user_id: userId,
          messages: updatedMessages,
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        sources: {
          characters: characters?.map((c) => c.name) || [],
          locations: locations?.map((l) => l.name) || [],
          races: races?.map((r) => r.name) || [],
          relics: relics?.map((r) => r.name) || [],
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
