import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKET } from "@/lib/storageSetup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, Edit, Trash2, Save, X, Images, ArrowUp, ArrowDown, 
  GripVertical, Eye, EyeOff, Megaphone, SortAsc, SortDesc, Link as LinkIcon 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterImageManager } from "./CharacterImageManager";
import { AlmanacGalleryManager } from "./AlmanacGalleryManager";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AlmanacEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  article: string;
  image_url: string | null;
  order_index: number;
  is_disabled: boolean;
  promo_enabled: boolean;
  promo_text: string | null;
  promo_link: string | null;
  promo_book_id: string | null;
  created_at: string;
  [key: string]: any;
}

interface Book {
  id: string;
  title: string;
  author: string;
}

const categoryConfig = {
  kingdoms: {
    table: "almanac_kingdoms",
    title: "Kingdoms",
    fields: [
      { name: "founded_date", label: "Founded Date", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["active", "fallen", "unknown"] },
    ],
  },
  relics: {
    table: "almanac_relics",
    title: "Relics",
    fields: [
      { name: "type", label: "Type", type: "text" },
      { name: "power_level", label: "Power Level", type: "text" },
    ],
  },
  races: {
    table: "almanac_races",
    title: "Races",
    fields: [
      { name: "population", label: "Population", type: "text" },
      { name: "homeland", label: "Homeland", type: "text" },
    ],
  },
  titles: {
    table: "almanac_titles",
    title: "Titles",
    fields: [
      { name: "rank", label: "Rank", type: "text" },
      { name: "authority", label: "Authority", type: "text" },
    ],
  },
  locations: {
    table: "almanac_locations",
    title: "Locations",
    fields: [
      { name: "location_type", label: "Location Type", type: "text" },
      { name: "kingdom", label: "Kingdom", type: "text" },
    ],
  },
  magic: {
    table: "almanac_magic",
    title: "Magic",
    fields: [
      { name: "magic_type", label: "Magic Type", type: "text" },
      { name: "difficulty", label: "Difficulty", type: "text" },
    ],
  },
  concepts: {
    table: "almanac_concepts",
    title: "Concepts",
    fields: [
      { name: "concept_type", label: "Concept Type", type: "text" },
    ],
  },
  characters: {
    table: "almanac_characters",
    title: "Characters",
    fields: [
      { name: "role", label: "Role", type: "text" },
      { name: "affiliation", label: "Affiliation", type: "text" },
      { name: "era", label: "Era", type: "select", options: ["BGD", "GD", "AGD", "Unknown"] },
      { name: "species", label: "Species", type: "text" },
      { name: "abilities", label: "Abilities", type: "textarea" },
      { name: "relationships", label: "Relationships", type: "textarea" },
    ],
  },
};

type SortMode = "custom" | "name_asc" | "name_desc" | "date_asc" | "date_desc";

export const AlmanacManager = () => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof categoryConfig>("kingdoms");
  const [entries, setEntries] = useState<AlmanacEntry[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showGalleryFor, setShowGalleryFor] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
    name: "",
    slug: "",
    description: "",
    article: "",
    image_url: "",
    is_disabled: false,
    promo_enabled: false,
    promo_text: "",
    promo_link: "",
    promo_book_id: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
    fetchBooks();
    setShowGalleryFor(null);
  }, [activeCategory]);

  useEffect(() => {
    if (showGalleryFor && activeCategory === "characters") {
      fetchGalleryImages(showGalleryFor);
    }
  }, [showGalleryFor]);

  const config = categoryConfig[activeCategory];
  const isCharacterCategory = activeCategory === "characters";

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from(config.table as any)
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${config.title.toLowerCase()}`,
        variant: "destructive",
      });
      return;
    }

    setEntries((data as any) || []);
  };

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("books" as any)
      .select("id, title, author")
      .eq("status", "active")
      .order("title");

    if (!error && data) {
      setBooks(data as unknown as Book[]);
    }
  };

  const fetchGalleryImages = async (characterId: string) => {
    const { data, error } = await supabase
      .from("almanac_character_images" as any)
      .select("*")
      .eq("character_id", characterId)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setGalleryImages(data as any[]);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `almanac/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({
          title: "Error",
          description: `Failed to upload image: ${uploadError.message}`,
          variant: "destructive",
        });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Image upload exception:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.article) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    let imageUrl = formData.image_url;
    if (imageFile) {
      imageUrl = await handleImageUpload(imageFile) || "";
    }

    const slug = formData.slug || generateSlug(formData.name);
    const orderIndex = editingId
      ? entries.find(e => e.id === editingId)?.order_index || 0
      : entries.length;

    const entryData: any = {
      name: formData.name,
      slug,
      description: formData.description,
      article: formData.article,
      image_url: imageUrl || null,
      order_index: orderIndex,
      is_disabled: formData.is_disabled || false,
      promo_enabled: formData.promo_enabled || false,
      promo_text: formData.promo_text || null,
      promo_link: formData.promo_link || null,
      promo_book_id: formData.promo_book_id || null,
    };

    config.fields.forEach(field => {
      entryData[field.name] = formData[field.name] || null;
    });

    if (editingId) {
      const { error } = await supabase
        .from(config.table as any)
        .update(entryData)
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to update ${config.title.toLowerCase().slice(0, -1)}`,
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await supabase
        .from(config.table as any)
        .insert(entryData);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to add ${config.title.toLowerCase().slice(0, -1)}`,
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Success",
      description: editingId ? "Entry updated successfully" : "Entry added successfully",
    });

    resetForm();
    fetchEntries();
  };

  const handleEdit = (entry: AlmanacEntry) => {
    const newFormData: Record<string, any> = {
      name: entry.name,
      slug: entry.slug,
      description: entry.description,
      article: entry.article,
      image_url: entry.image_url || "",
      is_disabled: entry.is_disabled || false,
      promo_enabled: entry.promo_enabled || false,
      promo_text: entry.promo_text || "",
      promo_link: entry.promo_link || "",
      promo_book_id: entry.promo_book_id || "",
    };

    config.fields.forEach(field => {
      newFormData[field.name] = entry[field.name] || "";
    });

    setFormData(newFormData);
    setEditingId(entry.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    const { error } = await supabase.from(config.table as any).delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "Entry deleted successfully" });
    fetchEntries();
  };

  const handleToggleDisabled = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from(config.table as any)
      .update({ is_disabled: !currentState })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update entry status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Entry ${!currentState ? "disabled" : "enabled"} successfully`,
    });
    fetchEntries();
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    await swapOrder(index, index - 1);
  };

  const handleMoveDown = async (index: number) => {
    if (index === entries.length - 1) return;
    await swapOrder(index, index + 1);
  };

  const swapOrder = async (fromIndex: number, toIndex: number) => {
    const fromEntry = entries[fromIndex];
    const toEntry = entries[toIndex];

    const updates = [
      supabase.from(config.table as any).update({ order_index: toIndex }).eq("id", fromEntry.id),
      supabase.from(config.table as any).update({ order_index: fromIndex }).eq("id", toEntry.id),
    ];

    await Promise.all(updates);
    fetchEntries();
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      const draggedIndex = entries.findIndex(e => e.id === draggedId);
      const targetIndex = entries.findIndex(e => e.id === targetId);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        reorderEntries(draggedIndex, targetIndex);
      }
    }
  };

  const reorderEntries = async (fromIndex: number, toIndex: number) => {
    const newEntries = [...entries];
    const [movedItem] = newEntries.splice(fromIndex, 1);
    newEntries.splice(toIndex, 0, movedItem);

    setEntries(newEntries);

    // Update order_index for all affected entries
    const updates = newEntries.map((entry, index) =>
      supabase.from(config.table as any).update({ order_index: index }).eq("id", entry.id)
    );

    await Promise.all(updates);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleSort = async (mode: SortMode) => {
    setSortMode(mode);

    if (mode === "custom") {
      fetchEntries();
      return;
    }

    let sortedEntries = [...entries];

    switch (mode) {
      case "name_asc":
        sortedEntries.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        sortedEntries.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "date_asc":
        sortedEntries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "date_desc":
        sortedEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    // Update order_index for all entries
    const updates = sortedEntries.map((entry, index) =>
      supabase.from(config.table as any).update({ order_index: index }).eq("id", entry.id)
    );

    await Promise.all(updates);
    setEntries(sortedEntries);
    toast({ title: "Success", description: "Entries reordered successfully" });
  };

  const resetForm = () => {
    const newFormData: Record<string, any> = {
      name: "",
      slug: "",
      description: "",
      article: "",
      image_url: "",
      is_disabled: false,
      promo_enabled: false,
      promo_text: "",
      promo_link: "",
      promo_book_id: "",
    };

    config.fields.forEach(field => {
      newFormData[field.name] = "";
    });

    setFormData(newFormData);
    setImageFile(null);
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold">Witness Almanac Manager</h2>
        <p className="text-muted-foreground">Manage lore entries for the Realms</p>
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => {
        setActiveCategory(v as keyof typeof categoryConfig);
        resetForm();
        setSortMode("custom");
      }}>
        <TabsList className="grid w-full grid-cols-8">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>{config.title}</TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(categoryConfig).map((key) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {sortMode === "custom" && <GripVertical className="h-4 w-4 mr-2" />}
                      {sortMode === "name_asc" && <SortAsc className="h-4 w-4 mr-2" />}
                      {sortMode === "name_desc" && <SortDesc className="h-4 w-4 mr-2" />}
                      {sortMode === "date_asc" && <SortAsc className="h-4 w-4 mr-2" />}
                      {sortMode === "date_desc" && <SortDesc className="h-4 w-4 mr-2" />}
                      Sort: {sortMode === "custom" ? "Custom" : 
                             sortMode === "name_asc" ? "Name (A-Z)" :
                             sortMode === "name_desc" ? "Name (Z-A)" :
                             sortMode === "date_asc" ? "Date (Old-New)" :
                             "Date (New-Old)"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSort("custom")}>
                      <GripVertical className="h-4 w-4 mr-2" /> Custom (Drag & Drop)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("name_asc")}>
                      <SortAsc className="h-4 w-4 mr-2" /> Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("name_desc")}>
                      <SortDesc className="h-4 w-4 mr-2" /> Name (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("date_asc")}>
                      <SortAsc className="h-4 w-4 mr-2" /> Date (Old → New)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("date_desc")}>
                      <SortDesc className="h-4 w-4 mr-2" /> Date (New → Old)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            {isAdding && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                      {editingId ? "Edit Entry" : "New Entry"}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={resetForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            name: e.target.value,
                            slug: generateSlug(e.target.value)
                          });
                        }}
                        placeholder="Entry name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Slug</label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="auto-generated"
                      />
                    </div>
                  </div>

                  {config.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-2">{field.label}</label>
                      {field.type === "select" && field.options ? (
                        <select
                          value={formData[field.name] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          className="w-full border border-input bg-background px-3 py-2 rounded-md"
                        >
                          <option value="">Select...</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <Textarea
                          value={formData[field.name] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          placeholder={field.label}
                          rows={3}
                        />
                      ) : (
                        <Input
                          value={formData[field.name] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          placeholder={field.label}
                        />
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium mb-2">Brief Description *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description shown on hover"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Full Article *</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      💡 Tip: Use [[Name]] to create cross-references to other entries. 
                      Example: "He fought [[Petronai]] in battle" will link to Petronai's entry.
                    </p>
                    <Textarea
                      value={formData.article}
                      onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                      placeholder="Full article content with detailed information. Use [[Name]] to reference other entries."
                      rows={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Image</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    {formData.image_url && (
                      <p className="text-xs text-muted-foreground mt-1">Current: {formData.image_url}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Visibility Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <EyeOff className="h-4 w-4" /> Visibility Settings
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_disabled"
                        checked={formData.is_disabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_disabled: checked })}
                      />
                      <Label htmlFor="is_disabled">Disable this entry (hidden from public view)</Label>
                    </div>
                  </div>

                  <Separator />

                  {/* Promo Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Megaphone className="h-4 w-4" /> Promo Settings
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="promo_enabled"
                        checked={formData.promo_enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, promo_enabled: checked })}
                      />
                      <Label htmlFor="promo_enabled">Enable promotional call-to-action</Label>
                    </div>

                    {formData.promo_enabled && (
                      <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                        <div>
                          <Label>Promo Text</Label>
                          <Input
                            value={formData.promo_text}
                            onChange={(e) => setFormData({ ...formData, promo_text: e.target.value })}
                            placeholder="Find out more about this character in Thou Art Remains"
                          />
                        </div>
                        <div>
                          <Label>Link to Book (optional)</Label>
                          <Select
                            value={formData.promo_book_id || ""}
                            onValueChange={(value) => setFormData({ 
                              ...formData, 
                              promo_book_id: value === "none" ? "" : value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a book..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No book</SelectItem>
                              {books.map((book) => (
                                <SelectItem key={book.id} value={book.id}>
                                  {book.title} by {book.author}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>External Link (optional)</Label>
                          <Input
                            value={formData.promo_link}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              promo_link: e.target.value
                            })}
                            placeholder="https://example.com"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            You can use both a book link and an external link together.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button onClick={handleSubmit}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingId ? "Update" : "Add"} Entry
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {sortMode === "custom" && <th className="w-8 p-4"></th>}
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Description</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Promo</th>
                      <th className="text-left p-4">Image</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr 
                        key={entry.id} 
                        className={`border-b hover:bg-muted/50 ${entry.is_disabled ? "opacity-50" : ""} ${draggedId === entry.id ? "bg-muted" : ""}`}
                        draggable={sortMode === "custom"}
                        onDragStart={() => handleDragStart(entry.id)}
                        onDragOver={(e) => handleDragOver(e, entry.id)}
                        onDragEnd={handleDragEnd}
                      >
                        {sortMode === "custom" && (
                          <td className="p-4 cursor-grab">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </td>
                        )}
                        <td className="p-4 font-medium">{entry.name}</td>
                        <td className="p-4 max-w-md truncate">{entry.description}</td>
                        <td className="p-4">
                          {entry.is_disabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                              <EyeOff className="h-3 w-3" /> Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <Eye className="h-3 w-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {entry.promo_enabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                              <Megaphone className="h-3 w-3" /> Yes
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">No</span>
                          )}
                        </td>
                        <td className="p-4">
                          {entry.image_url ? (
                            <img src={entry.image_url} alt={entry.name} className="h-10 w-10 object-cover rounded" />
                          ) : (
                            <span className="text-muted-foreground text-xs">No image</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1">
                            {sortMode === "custom" && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleMoveUp(index)}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleMoveDown(index)}
                                  disabled={index === entries.length - 1}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleToggleDisabled(entry.id, entry.is_disabled)}
                              title={entry.is_disabled ? "Enable entry" : "Disable entry"}
                            >
                              {entry.is_disabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setShowGalleryFor(showGalleryFor === entry.id ? null : entry.id)}
                              className={showGalleryFor === entry.id ? "bg-muted" : ""}
                              title="Manage gallery images"
                            >
                              <Images className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(entry.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {entries.length === 0 && (
                      <tr>
                        <td colSpan={sortMode === "custom" ? 7 : 6} className="p-8 text-center text-muted-foreground">
                          No entries yet. Add your first {config.title.toLowerCase()} entry!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Gallery Manager */}
            {showGalleryFor && (
              <Card className="p-6 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Gallery Images for: {entries.find(e => e.id === showGalleryFor)?.name}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowGalleryFor(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Separator className="mb-4" />
                {isCharacterCategory ? (
                  <CharacterImageManager
                    characterId={showGalleryFor}
                    images={galleryImages}
                    onImagesChange={() => fetchGalleryImages(showGalleryFor)}
                  />
                ) : (
                  <AlmanacGalleryManager
                    entryId={showGalleryFor}
                    category={activeCategory}
                  />
                )}
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
