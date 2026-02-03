import { Badge } from "@/components/ui/badge";

interface CategoryMetadataBadgesProps {
  categoryId: string;
  entry: {
    // Character
    role?: string;
    affiliation?: string;
    era?: string;
    species?: string;
    // Kingdom
    founded_date?: string;
    status?: string;
    // Location
    location_type?: string;
    kingdom?: string;
    // Magic
    magic_type?: string;
    difficulty?: string;
    // Relic
    type?: string;
    power_level?: string;
    // Race
    population?: string;
    homeland?: string;
    // Concept
    concept_type?: string;
    // Title
    rank?: string;
    authority?: string;
  };
  variant?: "default" | "compact";
}

export const CategoryMetadataBadges = ({ 
  categoryId, 
  entry, 
  variant = "default" 
}: CategoryMetadataBadgesProps) => {
  const isCompact = variant === "compact";
  const baseClasses = isCompact 
    ? "px-2 py-0.5 rounded text-xs" 
    : "px-3 py-1 rounded-full text-sm";

  const renderBadge = (value: string | undefined, style: "primary" | "secondary" | "accent" | "muted") => {
    if (!value) return null;
    
    const styles = {
      primary: "bg-[hsl(var(--parchment-gold))] text-white",
      secondary: "bg-[hsl(var(--parchment-border))] text-[hsl(var(--parchment-brown))]",
      accent: "bg-[hsl(var(--parchment-bg))] text-[hsl(var(--parchment-brown))]",
      muted: "bg-[hsl(var(--parchment-muted))] text-white",
    };
    
    return (
      <span className={`${baseClasses} ${styles[style]}`}>
        {value}
      </span>
    );
  };

  const badges: React.ReactNode[] = [];

  switch (categoryId) {
    case "characters":
      if (entry.role) badges.push(renderBadge(entry.role, "secondary"));
      if (entry.affiliation) badges.push(renderBadge(entry.affiliation, "accent"));
      if (entry.era) badges.push(renderBadge(entry.era, "primary"));
      if (entry.species) badges.push(renderBadge(entry.species, "muted"));
      break;
      
    case "kingdoms":
      if (entry.status) badges.push(renderBadge(entry.status, "primary"));
      if (entry.founded_date) badges.push(renderBadge(`Founded: ${entry.founded_date}`, "secondary"));
      break;
      
    case "locations":
      if (entry.location_type) badges.push(renderBadge(entry.location_type, "primary"));
      if (entry.kingdom) badges.push(renderBadge(entry.kingdom, "secondary"));
      break;
      
    case "magic":
      if (entry.magic_type) badges.push(renderBadge(entry.magic_type, "primary"));
      if (entry.difficulty) badges.push(renderBadge(`Difficulty: ${entry.difficulty}`, "secondary"));
      break;
      
    case "relics":
      if (entry.type) badges.push(renderBadge(entry.type, "primary"));
      if (entry.power_level) badges.push(renderBadge(`Power: ${entry.power_level}`, "secondary"));
      break;
      
    case "races":
      if (entry.homeland) badges.push(renderBadge(entry.homeland, "primary"));
      if (entry.population) badges.push(renderBadge(`Pop: ${entry.population}`, "secondary"));
      break;
      
    case "concepts":
      if (entry.concept_type) badges.push(renderBadge(entry.concept_type, "primary"));
      break;
      
    case "titles":
      if (entry.rank) badges.push(renderBadge(entry.rank, "primary"));
      if (entry.authority) badges.push(renderBadge(entry.authority, "secondary"));
      break;
  }

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap ${isCompact ? "gap-1" : "gap-2"} ${isCompact ? "mt-2" : "mt-4"}`}>
      {badges.map((badge, index) => (
        <span key={index}>{badge}</span>
      ))}
    </div>
  );
};
