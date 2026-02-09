import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LoreResponse {
  message: string;
  sources: {
    characters: string[];
    locations: string[];
    races: string[];
    relics: string[];
  };
}

export const useLoreAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Greetings, seeker of knowledge. I am the Keeper of Lore for the ThouArt universe. Ask me anything about our world—its inhabitants, locations, magic, or history.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSources, setLastSources] = useState<LoreResponse["sources"] | null>(
    null
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "https://pwbpbsyagyoytniidoah.functions.supabase.co/ai-lore-assistant",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: user ? `Bearer ${await user.id}` : "",
            },
            body: JSON.stringify({
              messages: [
                ...messages,
                userMessage,
              ],
              userId: user?.id,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response");
        }

        const data: LoreResponse = await response.json();
        
        const assistantMessage: Message = {
          role: "assistant",
          content: data.message,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setLastSources(data.sources);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Lore assistant error:", err);
        
        // Remove the user message on error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, user]
  );

  return {
    messages,
    isLoading,
    error,
    lastSources,
    sendMessage,
    clearMessages: () =>
      setMessages([
        {
          role: "assistant",
          content:
            "Greetings, seeker of knowledge. I am the Keeper of Lore for the ThouArt universe. Ask me anything about our world—its inhabitants, locations, magic, or history.",
        },
      ]),
  };
};
