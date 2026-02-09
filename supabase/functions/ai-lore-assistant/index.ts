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
  activeSessionId?: string;
  activeCampaignId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, userId, activeSessionId, activeCampaignId } = (await req.json()) as RequestBody;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        (l) => `Location: ${l.name} (${l.location_type})\nKingdom: ${l.kingdom}\nDescription: ${l.description}`
      ),
      ...(races || []).map(
        (r) => `Race: ${r.name}\nHomeland: ${r.homeland}\nPopulation: ${r.population}\nDescription: ${r.description}`
      ),
      ...(relics || []).map(
        (r) => `Relic: ${r.name}\nPower Level: ${r.power_level}\nType: ${r.type}\nDescription: ${r.description}`
      ),
    ].join("\n\n");

    // Build spoiler guard instructions if player is in an active session
    let spoilerGuard = "";
    if (activeSessionId && activeCampaignId) {
      // Fetch how far the player has progressed
      const { data: progress } = await supabase
        .from("rp_character_progress")
        .select("nodes_visited, current_node_id")
        .eq("session_id", activeSessionId)
        .limit(1)
        .single();

      // Fetch campaign node titles for visited nodes to know what they've seen
      const visitedNodes: string[] = (progress?.nodes_visited as string[]) || [];

      // Fetch future nodes the player hasn't visited
      const { data: campaignNodes } = await supabase
        .from("rp_story_nodes")
        .select("id, title")
        .eq("campaign_id", activeCampaignId);

      const unseenNodeTitles = (campaignNodes || [])
        .filter((n) => !visitedNodes.includes(n.id))
        .map((n) => n.title)
        .filter(Boolean);

      if (unseenNodeTitles.length > 0) {
        spoilerGuard = `

CRITICAL SPOILER GUARD: The player is currently in an active campaign session. They have NOT yet visited the following story nodes: ${unseenNodeTitles.slice(0, 10).join(", ")}${unseenNodeTitles.length > 10 ? "..." : ""}.

DO NOT reveal:
- What happens in story nodes they haven't visited yet
- Plot twists, character deaths, or betrayals that occur later in the campaign
- Specific choices or consequences from future nodes
- Hidden endings or secret paths they haven't discovered

If they ask about something that would be a spoiler, say: "I sense you are walking a path that has not yet revealed itself. Continue your journey, and you shall learn in time." Then redirect to lore that IS safe to discuss (general world knowledge, history, races, etc.).`;
      }
    }

    // Build system prompt with lore context + spoiler guard
    const systemPrompt = `You are the Keeper of Lore for the ThouArt universe. You answer questions about the world, its inhabitants, locations, magic, and history using ONLY the provided lore entries. 

If the answer isn't in the provided lore, say so and suggest related topics you DO know about.

Always be helpful, maintain the mystical tone of the world, and cite which lore entries you're drawing from.

Available lore context:
${context || "No specific lore matches found. Speaking from general knowledge of the ThouArt universe."}${spoilerGuard}`;

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
        JSON.stringify({ error: "Failed to generate response from AI", details: error }),
        { status: response.status, headers: corsHeaders }
      );
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices[0]?.message?.content || "I'm unable to answer that.";

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
            messages: updatedMessages.slice(-20),
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
