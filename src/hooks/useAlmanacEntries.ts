import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AlmanacEntry {
  id: string;
  name: string;
  slug: string;
  category: string;
}

const categoryTableMap: Record<string, string> = {
  kingdoms: "almanac_kingdoms",
  relics: "almanac_relics",
  races: "almanac_races",
  titles: "almanac_titles",
  locations: "almanac_locations",
  magic: "almanac_magic",
  concepts: "almanac_concepts",
  characters: "almanac_characters",
};

/**
 * Hook to fetch all almanac entries from all categories
 * for cross-referencing purposes.
 */
export const useAlmanacEntries = () => {
  const [entries, setEntries] = useState<AlmanacEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllEntries = async () => {
      const allEntries: AlmanacEntry[] = [];

      for (const [category, tableName] of Object.entries(categoryTableMap)) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select("id, name, slug");

        if (!error && data) {
          const entriesWithCategory = (data as any[]).map((entry) => ({
            ...entry,
            category,
          }));
          allEntries.push(...entriesWithCategory);
        }
      }

      setEntries(allEntries);
      setLoading(false);
    };

    fetchAllEntries();
  }, []);

  return { entries, loading };
};
