import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, User, Upload } from "lucide-react";

interface Character {
  id: string;
  name: string;
  slug: string;
  description: string;
  article: string;
  image_url: string | null;
  role: string | null;
  affiliation: string | null;
  era: string | null;
  species: string | null;
  abilities: string | null;
  relationships: string | null;
  order_index: number;
}

const ERAS = ["BGD", "GD", "AGD"];
const ROLES = ["Protagonist", "Antagonist", "Supporting", "Minor", "Historical"];

export const CharactersManager = () => {
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    article: "",
    image_url: "",
    role: "",
    affiliation: "",
    era: "",
    species: "",
    abilities: "",
    relationships: "",
  });

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("almanac_characters")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch characters",
        variant: "destructive",
      });
    } else {
      setCharacters(data || []);
    }
    setLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `almanac/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    setFormData({ ...formData, image_url: urlData.publicUrl });
    setUploading(false);
    toast({ title: "Image uploaded successfully" });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      article: "",
      image_url: "",
      role: "",
      affiliation: "",
      era: "",
      species: "",
      abilities: "",
      relationships: "",
    });
    setEditingCharacter(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Character name is required",
        variant: "destructive",
      });
      return;
    }

    const slug = generateSlug(formData.name);
    const characterData = {
      name: formData.name.trim(),
      slug,
      description: formData.description.trim(),
      article: formData.article.trim(),
      image_url: formData.image_url || null,
      role: formData.role || null,
      affiliation: formData.affiliation.trim() || null,
      era: formData.era || null,
      species: formData.species.trim() || null,
      abilities: formData.abilities.trim() || null,
      relationships: formData.relationships.trim() || null,
      order_index: editingCharacter?.order_index || characters.length,
    };

    if (editingCharacter) {
      const { error } = await (supabase as any)
        .from("almanac_characters")
        .update(characterData)
        .eq("id", editingCharacter.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update character",
          variant: "destructive",
        });
      } else {
        toast({ title: "Character updated successfully" });
        fetchCharacters();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await (supabase as any)
        .from("almanac_characters")
        .insert([characterData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create character",
          variant: "destructive",
        });
      } else {
        toast({ title: "Character created successfully" });
        fetchCharacters();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      description: character.description || "",
      article: character.article || "",
      image_url: character.image_url || "",
      role: character.role || "",
      affiliation: character.affiliation || "",
      era: character.era || "",
      species: character.species || "",
      abilities: character.abilities || "",
      relationships: character.relationships || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this character?")) return;

    const { error } = await (supabase as any)
      .from("almanac_characters")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete character",
        variant: "destructive",
      });
    } else {
      toast({ title: "Character deleted successfully" });
      fetchCharacters();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Characters Manager
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Character
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCharacter ? "Edit Character" : "Add New Character"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Character name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="era">Era</Label>
                  <Select
                    value={formData.era}
                    onValueChange={(value) => setFormData({ ...formData, era: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select era" />
                    </SelectTrigger>
                    <SelectContent>
                      {ERAS.map((era) => (
                        <SelectItem key={era} value={era}>
                          {era}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="species">Species</Label>
                  <Input
                    id="species"
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    placeholder="e.g., Human, Elf, Dragon"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliation">Affiliation</Label>
                <Input
                  id="affiliation"
                  value={formData.affiliation}
                  onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                  placeholder="e.g., Kingdom of Light, The Dark Order"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description for card display"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="article">Full Article</Label>
                <Textarea
                  id="article"
                  value={formData.article}
                  onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                  placeholder="Full character biography and lore"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abilities">Abilities</Label>
                <Textarea
                  id="abilities"
                  value={formData.abilities}
                  onChange={(e) => setFormData({ ...formData, abilities: e.target.value })}
                  placeholder="Character's powers, skills, and abilities"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationships">Relationships</Label>
                <Textarea
                  id="relationships"
                  value={formData.relationships}
                  onChange={(e) => setFormData({ ...formData, relationships: e.target.value })}
                  placeholder="Key relationships with other characters"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Character Image</Label>
                <div className="flex items-center gap-4">
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label
                      htmlFor="image-upload"
                      className="flex items-center justify-center gap-2 px-4 py-2 border rounded cursor-pointer hover:bg-muted"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Label>
                  </div>
                </div>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Or paste image URL"
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCharacter ? "Update Character" : "Add Character"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading characters...
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No characters yet. Add your first character to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Era</TableHead>
                <TableHead>Affiliation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {characters.map((character) => (
                <TableRow key={character.id}>
                  <TableCell>
                    {character.image_url ? (
                      <img
                        src={character.image_url}
                        alt={character.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{character.name}</TableCell>
                  <TableCell>
                    {character.role && (
                      <Badge variant="outline">{character.role}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {character.era && (
                      <Badge variant="secondary">{character.era}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {character.affiliation || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(character)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(character.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
