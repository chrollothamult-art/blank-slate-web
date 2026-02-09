import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RequestBody {
  sessionId: string;
  characterId: string;
  currentNodeId: string;
  actionContext?: string;
  transitionType?: "arrival" | "departure" | "event" | "narrative";
}

interface AIConfig {
  ai_enabled: boolean;
  dm_instructions: string | null;
  tone: string;
  guardrails: Record<string, unknown>;
  lore_context_ids: string[];
  npc_voice_profiles: Record<string, { name: string; style: string; traits: string[] }>;
}

interface CharacterStats {
  strength?: number;
  magic?: number;
  charisma?: number;
  wisdom?: number;
  agility?: number;
}

// Create a hash for caching purposes
function createPromptHash(sessionId: string, nodeId: string, flags: string): string {
  return `${sessionId}-${nodeId}-${flags}`.slice(0, 64);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sessionId, characterId, currentNodeId, actionContext, transitionType = "narrative" } =
      (await req.json()) as RequestBody;

    if (!sessionId || !characterId || !currentNodeId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sessionId, characterId, currentNodeId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from("rp_sessions")
      .select("campaign_id, story_flags")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch campaign AI config
    const { data: aiConfig } = await supabase
      .from("rp_campaign_ai_config")
      .select("*")
      .eq("campaign_id", session.campaign_id)
      .single();

    if (!aiConfig?.ai_enabled) {
      return new Response(
        JSON.stringify({ error: "AI Dungeon Master is not enabled for this campaign" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = aiConfig as unknown as AIConfig;

    // Check cache first
    const flagsHash = JSON.stringify(session.story_flags || {}).slice(0, 100);
    const promptHash = createPromptHash(sessionId, currentNodeId, flagsHash);

    const { data: cached } = await supabase
      .from("rp_ai_narration_log")
      .select("narration_text")
      .eq("prompt_hash", promptHash)
      .single();

    if (cached?.narration_text) {
      return new Response(
        JSON.stringify({
          narration: cached.narration_text,
          cached: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current node
    const { data: node } = await supabase
      .from("rp_story_nodes")
      .select("title, content, node_type, campaign_id")
      .eq("id", currentNodeId)
      .single();

    // Fetch character data
    const { data: character } = await supabase
      .from("rp_characters")
      .select("name, stats, level, backstory, race:almanac_races(name, description)")
      .eq("id", characterId)
      .single();

    // Fetch campaign info
    const { data: campaign } = await supabase
      .from("rp_campaigns")
      .select("title, description, genre, difficulty")
      .eq("id", session.campaign_id)
      .single();

    // Fetch recent action history (last 10 actions)
    const { data: recentActions } = await supabase
      .from("rp_action_log")
      .select("action_type, outcome, executed_at")
      .eq("session_id", sessionId)
      .order("executed_at", { ascending: false })
      .limit(10);

    // Fetch relevant almanac entries if lore context IDs are specified
    let loreContext = "";
    if (config.lore_context_ids && config.lore_context_ids.length > 0) {
      const { data: characters } = await supabase
        .from("almanac_characters")
        .select("name, description, role")
        .in("id", config.lore_context_ids)
        .limit(5);

      const { data: locations } = await supabase
        .from("almanac_locations")
        .select("name, description, kingdom")
        .in("id", config.lore_context_ids)
        .limit(5);

      loreContext = [
        ...(characters || []).map(c => `Character: ${c.name} (${c.role})\n${c.description}`),
        ...(locations || []).map(l => `Location: ${l.name} in ${l.kingdom}\n${l.description}`),
      ].join("\n\n");
    }

    // Build character context
    const stats = (character?.stats || {}) as CharacterStats;
    const statSummary = Object.entries(stats)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const nodeContent = (node?.content as { text?: string; npc_name?: string })?.text || "";
    const npcName = (node?.content as { npc_name?: string })?.npc_name;

    // Get NPC voice profile if available
    let npcVoiceInstruction = "";
    if (npcName && config.npc_voice_profiles) {
      const profile = Object.values(config.npc_voice_profiles).find(
        p => p.name.toLowerCase() === npcName.toLowerCase()
      );
      if (profile) {
        npcVoiceInstruction = `\n\nNPC "${npcName}" speaks in a ${profile.style} manner.`;
      }
    }

    // Build action history summary
    const historyContext = (recentActions || [])
      .slice(0, 5)
      .map((a, i) => {
        const outcome = (a.outcome as { result?: string })?.result || "completed";
        return `${i + 1}. ${a.action_type}: ${outcome}`;
      })
      .join("\n");

    // Build guardrails instructions
    const guardrails = config.guardrails || {};
    const guardrailInstructions = [
      guardrails.no_explicit_content ? "No explicit or adult content." : null,
      guardrails.family_friendly ? "Keep content family-friendly and suitable for all ages." : null,
      !guardrails.allow_violence ? "Avoid graphic violence descriptions." : null,
      guardrails.always_offer_peaceful_option ? "Always hint at a non-violent option." : null,
    ].filter(Boolean).join(" ");

    // Build the system prompt
    const systemPrompt = `You are the Dungeon Master for "${campaign?.title || "an adventure"}" — a ${campaign?.genre || "fantasy"} campaign.

CAMPAIGN DESCRIPTION:
${campaign?.description || "An epic adventure awaits."}

CURRENT SCENE:
${node?.title || "Untitled Scene"}
${nodeContent}

CHARACTER:
- Name: ${character?.name || "Unknown Hero"}
- Race: ${(character?.race as { name?: string })?.name || "Unknown"}
- Level: ${character?.level || 1}
- Stats: ${statSummary || "Standard"}
- Backstory: ${character?.backstory || "A mysterious wanderer"}

STORY STATE:
${JSON.stringify(session.story_flags || {}, null, 2)}

${historyContext ? `RECENT EVENTS:\n${historyContext}` : ""}

${loreContext ? `WORLD LORE:\n${loreContext}` : ""}

${actionContext ? `CURRENT ACTION: ${actionContext}` : ""}

DM INSTRUCTIONS:
${config.dm_instructions || "Narrate immersively, adapting to the player's choices."}

TONE: ${config.tone || "balanced"}
${npcVoiceInstruction}

GUARDRAILS: ${guardrailInstructions || "None specified."}

TRANSITION TYPE: ${transitionType}

YOUR TASK:
Generate a vivid, atmospheric narration (2-4 paragraphs) that:
1. Sets the scene and atmosphere appropriate to the tone
2. Describes what the character experiences entering this moment
3. If an NPC is present, include natural dialogue matching their voice profile
4. Hints at available choices without being explicit
5. Maintains continuity with recent events

Respond ONLY with the narration text. No meta-commentary.`;

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
            { role: "user", content: "Generate the narration for this scene." },
          ],
          stream: false,
          temperature: 0.85,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI narration generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const narration =
      aiResponse.choices?.[0]?.message?.content || "The story continues...";

    const tokensUsed = aiResponse.usage?.total_tokens || 0;

    // Cache the narration
    await supabase.from("rp_ai_narration_log").insert({
      session_id: sessionId,
      character_id: characterId,
      node_id: currentNodeId,
      prompt_hash: promptHash,
      narration_text: narration,
      model_used: "google/gemini-3-flash-preview",
      tokens_used: tokensUsed,
    });

    // Extract NPC dialogue if present (basic extraction)
    const dialogueMatches = narration.match(/"([^"]+)"/g);
    const npcDialogue = npcName && dialogueMatches
      ? dialogueMatches.map((d: string) => ({ name: npcName, text: d.replace(/"/g, "") }))
      : [];

    return new Response(
      JSON.stringify({
        narration,
        npc_dialogue: npcDialogue,
        cached: false,
        tokens_used: tokensUsed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
