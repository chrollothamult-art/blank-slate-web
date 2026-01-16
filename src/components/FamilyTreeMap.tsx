import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, ZoomIn, ZoomOut, RotateCcw, Crown } from "lucide-react";

interface Character {
  id: string;
  name: string;
  role?: string;
  affiliation?: string;
  image_url?: string;
}

interface FamilyRelationship {
  id: string;
  character_id: string;
  related_character_id: string;
  relationship_type: string;
  description?: string;
}

interface TreeNode {
  character: Character;
  x: number;
  y: number;
  generation: number;
}

const FAMILY_RELATIONSHIP_TYPES = [
  "parent",
  "child", 
  "spouse",
  "sibling",
  "grandparent",
  "grandchild",
  "uncle_aunt",
  "nephew_niece",
  "cousin",
  "ancestor",
  "descendant",
];

const relationshipColors: Record<string, string> = {
  parent: "hsl(262, 83%, 58%)",
  child: "hsl(280, 70%, 50%)",
  spouse: "hsl(340, 82%, 52%)",
  sibling: "hsl(199, 89%, 48%)",
  grandparent: "hsl(45, 93%, 47%)",
  grandchild: "hsl(25, 95%, 53%)",
  uncle_aunt: "hsl(173, 80%, 40%)",
  nephew_niece: "hsl(160, 70%, 45%)",
  cousin: "hsl(142, 76%, 36%)",
  ancestor: "hsl(220, 70%, 50%)",
  descendant: "hsl(200, 80%, 55%)",
  default: "hsl(var(--muted-foreground))",
};

const relationshipLabels: Record<string, string> = {
  parent: "Parent",
  child: "Child",
  spouse: "Spouse",
  sibling: "Sibling",
  grandparent: "Grandparent",
  grandchild: "Grandchild",
  uncle_aunt: "Uncle/Aunt",
  nephew_niece: "Nephew/Niece",
  cousin: "Cousin",
  ancestor: "Ancestor",
  descendant: "Descendant",
};

export const FamilyTreeMap = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<FamilyRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [rootCharacter, setRootCharacter] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: charactersData } = await supabase
      .from("almanac_characters" as any)
      .select("id, name, role, affiliation, image_url")
      .order("order_index", { ascending: true });

    const { data: relationshipsData } = await supabase
      .from("character_relationships" as any)
      .select("*");

    if (charactersData) {
      setCharacters(charactersData as unknown as Character[]);
    }
    if (relationshipsData) {
      // Filter only family relationships
      const familyRels = (relationshipsData as unknown as FamilyRelationship[]).filter(
        (r) => FAMILY_RELATIONSHIP_TYPES.includes(r.relationship_type)
      );
      setRelationships(familyRels);
    }

    setLoading(false);
  };

  // Find characters with family relationships
  const familyCharacters = useMemo(() => {
    const charIds = new Set<string>();
    relationships.forEach((r) => {
      charIds.add(r.character_id);
      charIds.add(r.related_character_id);
    });
    return characters.filter((c) => charIds.has(c.id));
  }, [characters, relationships]);

  // Build tree structure from root character
  const treeNodes = useMemo(() => {
    const nodes: TreeNode[] = [];
    const root = rootCharacter || (familyCharacters.length > 0 ? familyCharacters[0].id : null);
    
    if (!root || familyCharacters.length === 0) return nodes;

    const visited = new Set<string>();
    const levels: Record<number, Character[]> = {};
    
    // BFS to assign generations
    const queue: { id: string; gen: number }[] = [{ id: root, gen: 0 }];
    
    while (queue.length > 0) {
      const { id, gen } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      
      const char = familyCharacters.find((c) => c.id === id);
      if (!char) continue;
      
      if (!levels[gen]) levels[gen] = [];
      levels[gen].push(char);
      
      // Find related characters
      relationships.forEach((r) => {
        let targetId: string | null = null;
        let targetGen = gen;
        
        if (r.character_id === id && !visited.has(r.related_character_id)) {
          targetId = r.related_character_id;
          // Adjust generation based on relationship type
          if (["child", "grandchild", "nephew_niece", "descendant"].includes(r.relationship_type)) {
            targetGen = gen + 1;
          } else if (["parent", "grandparent", "uncle_aunt", "ancestor"].includes(r.relationship_type)) {
            targetGen = gen - 1;
          }
        } else if (r.related_character_id === id && !visited.has(r.character_id)) {
          targetId = r.character_id;
          // Reverse logic for incoming relationships
          if (["child", "grandchild", "nephew_niece", "descendant"].includes(r.relationship_type)) {
            targetGen = gen - 1;
          } else if (["parent", "grandparent", "uncle_aunt", "ancestor"].includes(r.relationship_type)) {
            targetGen = gen + 1;
          }
        }
        
        if (targetId) {
          queue.push({ id: targetId, gen: targetGen });
        }
      });
    }
    
    // Position nodes
    const minGen = Math.min(...Object.keys(levels).map(Number));
    const maxGen = Math.max(...Object.keys(levels).map(Number));
    const centerX = 400;
    const startY = 80;
    const levelHeight = 150;
    
    Object.entries(levels).forEach(([genStr, chars]) => {
      const gen = Number(genStr);
      const normalizedGen = gen - minGen;
      const y = startY + normalizedGen * levelHeight;
      const spacing = 800 / (chars.length + 1);
      
      chars.forEach((char, i) => {
        nodes.push({
          character: char,
          x: spacing * (i + 1),
          y,
          generation: normalizedGen,
        });
      });
    });
    
    return nodes;
  }, [familyCharacters, relationships, rootCharacter]);

  // Get node position by character ID
  const getNodePosition = useCallback((charId: string) => {
    const node = treeNodes.find((n) => n.character.id === charId);
    return node ? { x: node.x, y: node.y } : null;
  }, [treeNodes]);

  // Filter relationships visible in tree
  const visibleRelationships = useMemo(() => {
    const nodeIds = new Set(treeNodes.map((n) => n.character.id));
    return relationships.filter(
      (r) => nodeIds.has(r.character_id) && nodeIds.has(r.related_character_id)
    );
  }, [relationships, treeNodes]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedCharacter(null);
  };

  const getRelationshipColor = (type: string) => {
    return relationshipColors[type] || relationshipColors.default;
  };

  const svgHeight = Math.max(600, (Math.max(...treeNodes.map((n) => n.generation), 0) + 1) * 150 + 100);

  if (loading) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <GitBranch className="h-5 w-5" />
            Family Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[500px]" />
        </CardContent>
      </Card>
    );
  }

  if (familyCharacters.length === 0) {
    return (
      <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
            <GitBranch className="h-5 w-5" />
            Family Tree
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <GitBranch className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--parchment-muted))]" />
          <p className="text-[hsl(var(--parchment-muted))]">
            No family relationships found. Add family relationships (parent, child, spouse, sibling, etc.) in the admin panel to see the family tree.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[hsl(var(--parchment-card))] border-[hsl(var(--parchment-border))]">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle className="flex items-center gap-2 text-[hsl(var(--parchment-brown))]">
          <GitBranch className="h-5 w-5" />
          Family Tree
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-[hsl(var(--parchment-muted))]" />
            <Select value={rootCharacter || ""} onValueChange={(v) => setRootCharacter(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select root character" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background border border-border shadow-lg max-h-[300px] overflow-y-auto">
                {familyCharacters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(relationshipLabels).map(([type, label]) => (
            <Badge
              key={type}
              variant="outline"
              style={{ borderColor: relationshipColors[type], color: relationshipColors[type] }}
            >
              {label}
            </Badge>
          ))}
        </div>

        {/* SVG Tree */}
        <div className="relative overflow-hidden rounded-lg bg-[hsl(var(--parchment-bg))] border border-[hsl(var(--parchment-border))]">
          <svg
            width="100%"
            height={svgHeight}
            viewBox={`0 0 800 ${svgHeight}`}
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: "center center",
            }}
          >
            {/* Connection lines */}
            {visibleRelationships.map((rel) => {
              const source = getNodePosition(rel.character_id);
              const target = getNodePosition(rel.related_character_id);
              if (!source || !target) return null;

              const color = getRelationshipColor(rel.relationship_type);
              const isSpouse = rel.relationship_type === "spouse";
              const isSibling = rel.relationship_type === "sibling" || rel.relationship_type === "cousin";

              // Calculate control points for curved lines
              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;
              
              // Spouse connections are horizontal, siblings curve upward
              let pathD: string;
              if (isSpouse) {
                pathD = `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
              } else if (isSibling) {
                const curveHeight = Math.abs(source.x - target.x) * 0.3;
                pathD = `M ${source.x} ${source.y} Q ${midX} ${Math.min(source.y, target.y) - curveHeight} ${target.x} ${target.y}`;
              } else {
                // Parent-child vertical connections with slight curve
                pathD = `M ${source.x} ${source.y} Q ${source.x} ${midY} ${midX} ${midY} Q ${target.x} ${midY} ${target.x} ${target.y}`;
              }

              return (
                <g key={rel.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSpouse ? 3 : 2}
                    strokeOpacity={0.7}
                    strokeDasharray={isSpouse ? "8 4" : "none"}
                  />
                  <text
                    x={midX}
                    y={midY - 8}
                    fill={color}
                    fontSize="9"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {relationshipLabels[rel.relationship_type] || rel.relationship_type}
                  </text>
                </g>
              );
            })}

            {/* Character nodes */}
            {treeNodes.map((node) => {
              const isSelected = selectedCharacter === node.character.id;

              return (
                <g
                  key={node.character.id}
                  onClick={() => setSelectedCharacter(isSelected ? null : node.character.id)}
                  className="cursor-pointer"
                >
                  {/* Node background */}
                  <rect
                    x={node.x - 50}
                    y={node.y - 25}
                    width={100}
                    height={50}
                    rx={8}
                    fill={isSelected ? "hsl(var(--parchment-gold))" : "hsl(var(--parchment-card))"}
                    stroke={isSelected ? "hsl(var(--parchment-brown))" : "hsl(var(--parchment-border))"}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-200"
                  />
                  
                  {/* Character initial circle */}
                  <circle
                    cx={node.x - 30}
                    cy={node.y}
                    r={15}
                    fill="hsl(var(--parchment-gold))"
                    stroke="hsl(var(--parchment-brown))"
                    strokeWidth={1}
                  />
                  <text
                    x={node.x - 30}
                    y={node.y}
                    fill="hsl(var(--parchment-brown))"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {node.character.name.charAt(0)}
                  </text>
                  
                  {/* Character name */}
                  <text
                    x={node.x + 10}
                    y={node.y}
                    fill="hsl(var(--parchment-brown))"
                    fontSize="11"
                    fontWeight={isSelected ? "bold" : "normal"}
                    textAnchor="start"
                    dominantBaseline="central"
                    className="pointer-events-none"
                  >
                    {node.character.name.length > 10 ? node.character.name.slice(0, 10) + "..." : node.character.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected character info */}
        {selectedCharacter && (
          <div className="mt-4 p-4 rounded-lg bg-[hsl(var(--parchment-bg))] border border-[hsl(var(--parchment-border))]">
            {(() => {
              const char = familyCharacters.find((c) => c.id === selectedCharacter);
              if (!char) return null;
              const charRelationships = relationships.filter(
                (r) => r.character_id === char.id || r.related_character_id === char.id
              );
              return (
                <div>
                  <h4 className="font-heading font-bold text-lg text-[hsl(var(--parchment-brown))]">
                    {char.name}
                  </h4>
                  {char.role && (
                    <Badge variant="outline" className="mt-1">
                      {char.role}
                    </Badge>
                  )}
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-[hsl(var(--parchment-brown))]">
                      Family Connections ({charRelationships.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {charRelationships.map((rel) => {
                        const otherId = rel.character_id === char.id ? rel.related_character_id : rel.character_id;
                        const otherChar = familyCharacters.find((c) => c.id === otherId);
                        return (
                          <Badge
                            key={rel.id}
                            variant="secondary"
                            style={{ 
                              borderColor: getRelationshipColor(rel.relationship_type),
                              borderWidth: 1,
                              borderStyle: "solid"
                            }}
                          >
                            {otherChar?.name} ({relationshipLabels[rel.relationship_type] || rel.relationship_type})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
