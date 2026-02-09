import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RequestBody {
  raceId: string | null;
  raceName: string | null;
  stats: {
    strength: number;
    magic: number;
    charisma: number;
    wisdom: number;
    agility: number;
  };
  playerPrompt?: string;
  existingBackstory?: string;
  mode?: "full" | "inspire";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { raceId, raceName, stats, playerPrompt, existingBackstory, mode = "full" } =
      (await req.json()) as RequestBody;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch race lore if raceId provided
    let raceLore = "";
    if (raceId) {
      const { data: raceData } = await supabase
        .from("almanac_races")
        .select("name, description, homeland, population, article")
        .eq("id", raceId)
        .single();

      if (raceData) {
        raceLore = `Race: ${raceData.name}
Homeland: ${raceData.homeland || "Unknown"}
Description: ${raceData.description}
${raceData.article ? `\nLore: ${raceData.article.slice(0, 500)}...` : ""}`;
      }
    }

    // Fetch some random locations and factions for world grounding
    const { data: locations } = await supabase
      .from("almanac_locations")
      .select("name, kingdom, location_type")
      .limit(5);

    const { data: kingdoms } = await supabase
      .from("almanac_kingdoms")
      .select("name, status")
      .limit(3);

    const worldContext = [
      ...(locations || []).map(
        (l) => `${l.name} (${l.location_type} in ${l.kingdom})`
      ),
      ...(kingdoms || []).map((k) => `Kingdom of ${k.name}`),
    ].join(", ");

    // Interpret stats into narrative hooks
    const statInterpretations: string[] = [];
    if (stats.strength >= 6)
      statInterpretations.push("trained as a warrior, laborer, or gladiator");
    if (stats.magic >= 6)
      statInterpretations.push("studied at an arcane academy, has wild magic, or carries a cursed bloodline");
    if (stats.charisma >= 6)
      statInterpretations.push("worked as a diplomat, merchant, performer, or cult leader");
    if (stats.wisdom >= 6)
      statInterpretations.push("lived as a hermit, scholar, or elder's apprentice");
    if (stats.agility >= 6)
      statInterpretations.push("served as a thief, scout, acrobat, or hunter");

    const statNarrative =
      statInterpretations.length > 0
        ? `Their abilities suggest they may have ${statInterpretations.join(" or ")}.`
        : "They are balanced in all abilities, a jack of all trades.";

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // "Inspire Me" mode: generate 3 short hooks
    if (mode === "inspire") {
      const inspirePrompt = `You are a creative writer for the ThouArt fantasy universe. Generate exactly 3 short, distinct backstory hooks (one-liners) for a character.

Use the following world lore for grounding:
${raceLore || `Race: ${raceName || "Custom Origin"}`}

Known locations: ${worldContext || "Various kingdoms and lands"}

${statNarrative}

Guidelines:
- Each hook should be 1-2 sentences max
- Each should suggest a dramatically different origin or motivation
- Make them intriguing and emotionally resonant
- Reference real locations/factions from the world when possible
- Do NOT include character names

Return ONLY a JSON array of 3 strings, no other text. Example format:
["Hook 1 text here.", "Hook 2 text here.", "Hook 3 text here."]`;

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
              { role: "system", content: inspirePrompt },
              { role: "user", content: "Generate 3 backstory hooks." },
            ],
            stream: false,
            temperature: 0.9,
            max_tokens: 400,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("AI Gateway error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to generate hooks", details: error }),
          { status: response.status, headers: corsHeaders }
        );
      }

      const aiResponse = await response.json();
      const rawContent = aiResponse.choices[0]?.message?.content || "[]";

      // Parse the JSON array from the response
      let hooks: string[] = [];
      try {
        const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          hooks = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback: split by newlines
        hooks = rawContent
          .split("\n")
          .filter((l: string) => l.trim().length > 10)
          .slice(0, 3);
      }

      if (hooks.length === 0) {
        hooks = [
          "A wanderer haunted by a forgotten prophecy, seeking answers in the ruins of an ancient kingdom.",
          "Once a trusted advisor to a powerful ruler, now exiled and hunted for a crime they didn't commit.",
          "Born during a celestial convergence, they carry a gift — or curse — that draws both allies and enemies.",
        ];
      }

      return new Response(
        JSON.stringify({ hooks: hooks.slice(0, 3) }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Full backstory generation (original logic)
    const systemPrompt = `You are a creative writer for the ThouArt fantasy universe. Generate a compelling 2-3 paragraph character backstory.

Use the following world lore for grounding:
${raceLore || `Race: ${raceName || "Custom Origin"}`}

Known locations in this world: ${worldContext || "Various kingdoms and lands"}

${statNarrative}

${playerPrompt ? `The player wants: ${playerPrompt}` : ""}

${existingBackstory ? `Previous backstory to refine: ${existingBackstory}` : ""}

Guidelines:
- Make the backstory feel personal and emotionally resonant
- Reference real locations and kingdoms from the world when possible
- Explain how their skills developed (training, natural talent, circumstances)
- Include a defining moment or conflict that shaped who they are
- Keep it under 400 words
- Do NOT include their name in the backstory - use "they" or "the character" instead`;

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
            { role: "user", content: "Generate a compelling character backstory." },
          ],
          stream: false,
          temperature: 0.8,
          max_tokens: 800,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("AI Gateway error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate backstory", details: error }),
        { status: response.status, headers: corsHeaders }
      );
    }

    const aiResponse = await response.json();
    const backstory = aiResponse.choices[0]?.message?.content || "Unable to generate backstory.";

    return new Response(
      JSON.stringify({ backstory, suggestedName: null }),
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
