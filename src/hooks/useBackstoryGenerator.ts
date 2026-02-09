import { useState, useCallback } from "react";

interface BackstoryParams {
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
}

interface BackstoryResponse {
  backstory: string;
  suggestedName: string | null;
}

export const useBackstoryGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBackstory = useCallback(
    async (params: BackstoryParams): Promise<string | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch(
          "https://pwbpbsyagyoytniidoah.functions.supabase.co/ai-generate-backstory",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate backstory");
        }

        const data: BackstoryResponse = await response.json();
        return data.backstory;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Backstory generation error:", err);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  return {
    generateBackstory,
    isGenerating,
    error,
    clearError: () => setError(null),
  };
};
