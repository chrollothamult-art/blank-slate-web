import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CharacterStats {
  strength?: number;
  magic?: number;
  charisma?: number;
  wisdom?: number;
  agility?: number;
}

interface PastAction {
  text: string;
  outcome: string;
  stat_check?: string;
}

interface RequestBody {
  sessionId: string;
  characterId: string;
  nodeId: string;
  playerText: string;
  actionHistory?: PastAction[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, characterId, nodeId, playerText, actionHistory } = (await req.json()) as RequestBody;

    if (!sessionId || !characterId || !playerText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch character data
    const { data: character, error: charError } = await supabase
      .from("rp_characters")
      .select("name, stats, level, backstory, race:almanac_races(name)")
      .eq("id", characterId)
      .single();

    if (charError || !character) {
      return new Response(
        JSON.stringify({ error: "Character not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current node context
    const { data: node } = await supabase
      .from("rp_story_nodes")
      .select("title, content, campaign_id")
      .eq("id", nodeId)
      .single();

    // Fetch session story flags
    const { data: session } = await supabase
      .from("rp_sessions")
      .select("story_flags")
      .eq("id", sessionId)
      .single();

    // Fetch campaign AI config if exists
    const { data: aiConfig } = await supabase
      .from("rp_campaign_ai_config")
      .select("dm_instructions, tone, guardrails")
      .eq("campaign_id", node?.campaign_id)
      .single();

    // Fetch character inventory for validation
    const { data: inventory } = await supabase
      .from("rp_character_inventory")
      .select("item:rp_items(name, type)")
      .eq("character_id", characterId);

    const inventoryItems = (inventory || [])
      .map((i: any) => i.item?.name)
      .filter(Boolean);

    // Build character context
    const stats = (character.stats || {}) as CharacterStats;
    const statSummary = Object.entries(stats)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const nodeContent = node?.content as { text?: string } | null;

    // Build action history context for memory integration
    const historyContext = (actionHistory || [])
      .slice(-10) // Keep last 10 actions for context window management
      .map((a, i) => `Action ${i + 1}: "${a.text}" → ${a.outcome}${a.stat_check ? ` (${a.stat_check})` : ""}`)
      .join("\n");

    // Build system prompt with action validation and memory
    const systemPrompt = `You are the Dungeon Master for an interactive roleplay adventure. You interpret player actions and determine outcomes based on their character's abilities.

CURRENT SCENE:
${nodeContent?.text || "The adventure continues..."}

CHARACTER SHEET:
- Name: ${character.name}
- Race: ${(character.race as { name?: string })?.name || "Unknown"}
- Level: ${character.level}
- Stats: ${statSummary}
- Backstory: ${character.backstory || "None provided"}
- Inventory: ${inventoryItems.length > 0 ? inventoryItems.join(", ") : "Empty"}

STORY STATE:
${JSON.stringify(session?.story_flags || {}, null, 2)}

${historyContext ? `RECENT ACTION HISTORY (for continuity):\n${historyContext}\n` : ""}
${aiConfig?.dm_instructions ? `DM INSTRUCTIONS: ${aiConfig.dm_instructions}` : ""}
${aiConfig?.tone ? `TONE: ${aiConfig.tone}` : ""}
${aiConfig?.guardrails ? `GUARDRAILS: ${JSON.stringify(aiConfig.guardrails)}` : ""}

CRITICAL RULES FOR ACTION VALIDATION:
1. If the action is physically impossible (flying without wings/magic, teleporting, breaking physics), REJECT it with is_valid=false and an in-character explanation.
2. If the action requires an item the character doesn't have (picking a lock without lockpicks, shooting without a bow), REJECT it with is_valid=false.
3. If the action references something not in the current scene, gently redirect with is_valid=false.
4. If the action contradicts the guardrails (e.g., romance in a no-romance campaign), REJECT with is_valid=false.
5. VALID actions should proceed to stat checks and narration as normal.
6. Reference recent action history for continuity — acknowledge past events when relevant.

When the action IS valid:
1. Determine which stat check applies (if any)
2. Roll against the difficulty (player's stat value vs a difficulty of 1-10)
3. Narrate the outcome based on success or failure
4. Apply any stat changes, flag changes, or XP rewards

Respond ONLY with a JSON object using this exact structure:
{
  "is_valid": true/false,
  "interpretation": "Brief summary of what the player is attempting",
  "rejection_reason": "In-character explanation if is_valid=false, null otherwise",
  "stat_check": {
    "stat": "agility|strength|magic|charisma|wisdom|null",
    "difficulty": 5,
    "player_value": 4,
    "result": "pass|fail|none"
  },
  "outcome_narration": "Vivid description of what happens (2-4 sentences)",
  "stat_effects": { "stat_name": 1 },
  "flag_effects": { "flag_name": true },
  "xp_reward": 10
}`;

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
            { role: "user", content: `Player action: "${playerText}"` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "resolve_action",
                description: "Resolve a player action with validation, stat checks and outcomes",
                parameters: {
                  type: "object",
                  properties: {
                    is_valid: { type: "boolean", description: "Whether the action is physically possible and valid in context" },
                    interpretation: { type: "string", description: "Brief summary of what the player is attempting" },
                    rejection_reason: { type: "string", description: "In-character explanation if action is invalid, null if valid" },
                    stat_check: {
                      type: "object",
                      properties: {
                        stat: { type: "string", enum: ["strength", "magic", "charisma", "wisdom", "agility", "none"] },
                        difficulty: { type: "number" },
                        player_value: { type: "number" },
                        result: { type: "string", enum: ["pass", "fail", "none"] }
                      },
                      required: ["stat", "difficulty", "result"]
                    },
                    outcome_narration: { type: "string", description: "Vivid 2-4 sentence narration of what happens" },
                    stat_effects: { type: "object", additionalProperties: { type: "number" } },
                    flag_effects: { type: "object", additionalProperties: { type: "boolean" } },
                    xp_reward: { type: "number" }
                  },
                  required: ["is_valid", "interpretation", "outcome_narration"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "resolve_action" } },
          temperature: 0.8,
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
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI interpretation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    
    // Extract the tool call result
    let result;
    const toolCalls = aiResponse.choices?.[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      try {
        result = JSON.parse(toolCalls[0].function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback to parsing from content if tool call failed
    if (!result) {
      const content = aiResponse.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      } catch {
        result = {
          is_valid: true,
          interpretation: "Your action is considered...",
          outcome_narration: content || "The story continues...",
          stat_check: { stat: "none", difficulty: 0, result: "none" },
          stat_effects: {},
          flag_effects: {},
          xp_reward: 5
        };
      }
    }

    // If action is invalid, return the rejection without applying any effects
    if (result.is_valid === false) {
      return new Response(
        JSON.stringify({
          success: true,
          is_valid: false,
          interpretation: result.interpretation,
          rejection_reason: result.rejection_reason || result.outcome_narration,
          outcome_narration: result.rejection_reason || result.outcome_narration,
          stat_check: { stat: "none", difficulty: 0, result: "none" },
          stat_effects: {},
          flag_effects: {},
          xp_reward: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Apply stat effects to character if any
    if (result.stat_effects && Object.keys(result.stat_effects).length > 0) {
      const newStats = { ...stats };
      for (const [stat, change] of Object.entries(result.stat_effects)) {
        const statKey = stat as keyof CharacterStats;
        if (statKey in newStats) {
          newStats[statKey] = Math.max(1, Math.min(10, (newStats[statKey] || 3) + (change as number)));
        }
      }
      await supabase
        .from("rp_characters")
        .update({ stats: newStats })
        .eq("id", characterId);
    }

    // Apply XP reward if any
    if (result.xp_reward && result.xp_reward > 0) {
      const { data: charXp } = await supabase
        .from("rp_characters")
        .select("xp, level")
        .eq("id", characterId)
        .single();
      
      if (charXp) {
        const newXp = charXp.xp + result.xp_reward;
        let newLevel = charXp.level;
        let threshold = charXp.level * 100;
        if (newXp >= threshold) {
          newLevel = Math.min(20, charXp.level + 1);
        }
        
        await supabase
          .from("rp_characters")
          .update({ xp: newXp, level: newLevel })
          .eq("id", characterId);
      }
    }

    // Update session story flags if any
    if (result.flag_effects && Object.keys(result.flag_effects).length > 0) {
      const currentFlags = (session?.story_flags || {}) as Record<string, unknown>;
      const newFlags = { ...currentFlags, ...result.flag_effects };
      await supabase
        .from("rp_sessions")
        .update({ story_flags: newFlags })
        .eq("id", sessionId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_valid: true,
        ...result
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
