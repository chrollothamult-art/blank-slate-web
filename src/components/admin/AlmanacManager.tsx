import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKET } from "@/lib/storageSetup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AlmanacEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  article: string;
  image_url: string | null;
  order_index: number;
  [key: string]: any;
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
};

export const AlmanacManager = () => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof categoryConfig>("kingdoms");
  const [entries, setEntries] = useState<AlmanacEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    slug: "",
    description: "",
    article: "",
    image_url: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, [activeCategory]);

  const config = categoryConfig[activeCategory];

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

        if (uploadError.message?.includes("not found")) {
          toast({
            title: "Error",
            description: "Storage bucket not configured. Please contact administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to upload image: ${uploadError.message}`,
            variant: "destructive",
          });
        }
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
    const newFormData: Record<string, string> = {
      name: entry.name,
      slug: entry.slug,
      description: entry.description,
      article: entry.article,
      image_url: entry.image_url || "",
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

  const resetForm = () => {
    const newFormData: Record<string, string> = {
      name: "",
      slug: "",
      description: "",
      article: "",
      image_url: "",
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
      }}>
        <TabsList className="grid w-full grid-cols-7">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>{config.title}</TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(categoryConfig).map((key) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <div className="flex justify-end">
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
                    <Textarea
                      value={formData.article}
                      onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                      placeholder="Full article content with detailed information"
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
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Description</th>
                      <th className="text-left p-4">Image</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{entry.name}</td>
                        <td className="p-4 max-w-md truncate">{entry.description}</td>
                        <td className="p-4">
                          {entry.image_url ? (
                            <img src={entry.image_url} alt={entry.name} className="h-10 w-10 object-cover rounded" />
                          ) : (
                            <span className="text-muted-foreground text-xs">No image</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                              <Edit className="h-4 w-4" />
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
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No entries yet. Add your first {config.title.toLowerCase()} entry!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
