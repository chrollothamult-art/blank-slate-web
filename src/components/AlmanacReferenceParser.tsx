import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface AlmanacEntry {
  id: string;
  name: string;
  slug: string;
  category?: string;
}

interface AlmanacReferenceParserProps {
  content: string;
  allEntries: AlmanacEntry[];
  currentEntryId?: string;
  className?: string;
}

/**
 * Parses almanac article content and converts [[reference]] syntax
 * into clickable links that navigate to the referenced entry.
 * 
 * Usage in articles: "He fought [[Petronai]] in the great battle"
 * This will link "Petronai" to the matching almanac entry.
 */
export const AlmanacReferenceParser = ({
  content,
  allEntries,
  currentEntryId,
  className = "",
}: AlmanacReferenceParserProps) => {
  const navigate = useNavigate();

  const parsedContent = useMemo(() => {
    if (!content) return [];

    // Match [[reference]] pattern
    const referencePattern = /\[\[([^\]]+)\]\]/g;
    const parts: Array<{ type: "text" | "reference"; content: string; entry?: AlmanacEntry }> = [];
    
    let lastIndex = 0;
    let match;

    while ((match = referencePattern.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }

      const referenceName = match[1].trim();
      
      // Find matching entry (case-insensitive)
      const matchedEntry = allEntries.find(
        (entry) => 
          entry.name.toLowerCase() === referenceName.toLowerCase() ||
          entry.slug.toLowerCase() === referenceName.toLowerCase().replace(/\s+/g, "-")
      );

      parts.push({
        type: "reference",
        content: referenceName,
        entry: matchedEntry,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    return parts;
  }, [content, allEntries]);

  const handleReferenceClick = (entry: AlmanacEntry) => {
    if (entry.id === currentEntryId) return;
    
    // Determine the category from the entry or navigate to a search
    if (entry.category) {
      navigate(`/almanac/${entry.category}?entry=${entry.slug}`);
    }
  };

  return (
    <span className={className}>
      {parsedContent.map((part, index) => {
        if (part.type === "text") {
          // Preserve whitespace and newlines
          return (
            <span key={index} className="whitespace-pre-line">
              {part.content}
            </span>
          );
        }

        if (part.type === "reference" && part.entry) {
          const isSameEntry = part.entry.id === currentEntryId;
          
          return (
            <button
              key={index}
              onClick={() => !isSameEntry && handleReferenceClick(part.entry!)}
              className={`
                inline font-medium underline decoration-dotted underline-offset-2
                ${isSameEntry 
                  ? "text-[hsl(var(--parchment-muted))] cursor-default" 
                  : "text-[hsl(var(--parchment-gold))] hover:text-[hsl(var(--parchment-brown))] cursor-pointer transition-colors"
                }
              `}
              disabled={isSameEntry}
              title={part.entry.name}
            >
              {part.content}
            </button>
          );
        }

        // Unmatched reference - show as styled but not clickable
        return (
          <span
            key={index}
            className="text-[hsl(var(--parchment-muted))] italic"
            title="Entry not found"
          >
            {part.content}
          </span>
        );
      })}
    </span>
  );
};
