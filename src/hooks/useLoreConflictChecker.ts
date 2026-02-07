import { useState, useCallback } from "react";
import { useAlmanacEntries } from "@/hooks/useAlmanacEntries";

export interface LoreConflict {
  type: "name_duplicate" | "similar_name";
  existingName: string;
  existingCategory: string;
  severity: "warning" | "error";
  message: string;
}

/**
 * Hook to check new lore proposals against existing almanac entries
 * for potential conflicts and duplicates.
 */
export const useLoreConflictChecker = () => {
  const { entries, loading: entriesLoading } = useAlmanacEntries();
  const [conflicts, setConflicts] = useState<LoreConflict[]>([]);

  const normalize = (str: string) => str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");

  const levenshtein = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = b[i - 1] === a[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[b.length][a.length];
  };

  const checkConflicts = useCallback(
    (proposedName: string, proposedCategory?: string) => {
      if (!proposedName || proposedName.length < 2 || entriesLoading) {
        setConflicts([]);
        return [];
      }

      const normalizedProposed = normalize(proposedName);
      const found: LoreConflict[] = [];

      for (const entry of entries) {
        const normalizedEntry = normalize(entry.name);

        // Exact match
        if (normalizedProposed === normalizedEntry) {
          found.push({
            type: "name_duplicate",
            existingName: entry.name,
            existingCategory: entry.category,
            severity: "error",
            message: `"${entry.name}" already exists in ${entry.category}`,
          });
          continue;
        }

        // Similar name check (Levenshtein distance ≤ 2 for short names, ≤ 3 for longer)
        const threshold = normalizedProposed.length <= 6 ? 2 : 3;
        const distance = levenshtein(normalizedProposed, normalizedEntry);

        if (distance <= threshold && distance > 0) {
          found.push({
            type: "similar_name",
            existingName: entry.name,
            existingCategory: entry.category,
            severity: "warning",
            message: `Similar to "${entry.name}" in ${entry.category}`,
          });
        }

        // Substring containment for longer names
        if (
          normalizedProposed.length >= 4 &&
          normalizedEntry.length >= 4 &&
          (normalizedProposed.includes(normalizedEntry) || normalizedEntry.includes(normalizedProposed))
        ) {
          if (!found.some((f) => f.existingName === entry.name)) {
            found.push({
              type: "similar_name",
              existingName: entry.name,
              existingCategory: entry.category,
              severity: "warning",
              message: `Name overlaps with "${entry.name}" in ${entry.category}`,
            });
          }
        }
      }

      // Limit results to top 5
      const limited = found.slice(0, 5);
      setConflicts(limited);
      return limited;
    },
    [entries, entriesLoading]
  );

  return {
    conflicts,
    checkConflicts,
    loading: entriesLoading,
  };
};
