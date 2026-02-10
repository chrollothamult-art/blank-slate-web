import { useState, useMemo, Fragment } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAlmanacEntries } from "@/hooks/useAlmanacEntries";

interface LoreTooltipTextProps {
  text: string;
  className?: string;
}

interface AlmanacMatch {
  name: string;
  slug: string;
  category: string;
  description?: string;
  start: number;
  end: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  characters: "👤",
  locations: "📍",
  kingdoms: "🏰",
  races: "🧬",
  relics: "⚔️",
  magic: "✨",
  concepts: "📜",
  titles: "👑",
};

const CATEGORY_LABELS: Record<string, string> = {
  characters: "Character",
  locations: "Location",
  kingdoms: "Kingdom",
  races: "Race",
  relics: "Relic",
  magic: "Magic",
  concepts: "Concept",
  titles: "Title",
};

/**
 * Renders text with inline lore tooltips.
 * Detects [[term]] syntax and auto-matches known almanac entry names.
 */
export const LoreTooltipText = ({ text, className }: LoreTooltipTextProps) => {
  const { entries } = useAlmanacEntries();

  const segments = useMemo(() => {
    if (!entries.length || !text) return [{ type: "text" as const, content: text }];

    // First, handle explicit [[term]] syntax
    let processedText = text;
    const explicitMatches: AlmanacMatch[] = [];
    const bracketRegex = /\[\[([^\]]+)\]\]/g;
    let bracketMatch;
    let offset = 0;

    while ((bracketMatch = bracketRegex.exec(text)) !== null) {
      const termName = bracketMatch[1];
      const entry = entries.find(
        (e) => e.name.toLowerCase() === termName.toLowerCase()
      );

      if (entry) {
        // Remove the brackets from displayed text
        const cleanStart = bracketMatch.index - offset;
        processedText =
          processedText.slice(0, cleanStart) +
          termName +
          processedText.slice(cleanStart + bracketMatch[0].length);
        offset += 4; // [[ and ]]
        explicitMatches.push({
          ...entry,
          start: cleanStart,
          end: cleanStart + termName.length,
        });
      }
    }

    // Then auto-detect almanac names (only names >= 4 chars to avoid false positives)
    const autoMatches: AlmanacMatch[] = [];
    const sortedEntries = [...entries]
      .filter((e) => e.name.length >= 4)
      .sort((a, b) => b.name.length - a.name.length);

    for (const entry of sortedEntries) {
      const regex = new RegExp(`\\b${escapeRegex(entry.name)}\\b`, "gi");
      let match;
      while ((match = regex.exec(processedText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        // Don't overlap with existing matches
        const overlaps = [...explicitMatches, ...autoMatches].some(
          (m) => start < m.end && end > m.start
        );
        if (!overlaps) {
          autoMatches.push({ ...entry, name: match[0], start, end });
        }
      }
    }

    // Combine and sort all matches
    const allMatches = [...explicitMatches, ...autoMatches].sort(
      (a, b) => a.start - b.start
    );

    if (allMatches.length === 0) {
      return [{ type: "text" as const, content: processedText }];
    }

    // Build segments
    const result: Array<
      | { type: "text"; content: string }
      | { type: "lore"; content: string; category: string; slug: string; description?: string }
    > = [];
    let lastEnd = 0;

    for (const m of allMatches) {
      if (m.start > lastEnd) {
        result.push({ type: "text", content: processedText.slice(lastEnd, m.start) });
      }
      result.push({
        type: "lore",
        content: processedText.slice(m.start, m.end),
        category: m.category,
        slug: m.slug,
        description: m.description,
      });
      lastEnd = m.end;
    }

    if (lastEnd < processedText.length) {
      result.push({ type: "text", content: processedText.slice(lastEnd) });
    }

    return result;
  }, [text, entries]);

  return (
    <TooltipProvider delayDuration={300}>
      <span className={className}>
        {segments.map((seg, i) => {
          if (seg.type === "text") {
            return <Fragment key={i}>{seg.content}</Fragment>;
          }

          const icon = CATEGORY_ICONS[seg.category] || "📖";
          const label = CATEGORY_LABELS[seg.category] || seg.category;

          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span className="border-b border-dotted border-primary/50 text-primary cursor-help hover:bg-primary/10 transition-colors rounded-sm px-0.5">
                  {seg.content}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">{icon}</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{seg.content}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {label}
                      </Badge>
                    </div>
                    {seg.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {seg.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      Click to view full entry
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </span>
    </TooltipProvider>
  );
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
