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
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

interface Location {
  id: string;
  name: string;
  type: string;
  description: string;
  x_position: number;
  y_position: number;
  color: string | null;
}

const LOCATION_TYPES = ["kingdom", "city", "landmark", "region"];

const typeColors: Record<string, string> = {
  kingdom: "hsl(45, 93%, 47%)",
  city: "hsl(173, 80%, 40%)",
  landmark: "hsl(262, 83%, 58%)",
  region: "hsl(25, 50%, 50%)",
};

export const LocationsManager = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "city",
    description: "",
    x_position: 50,
    y_position: 50,
    color: "",
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("world_locations")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch locations",
        variant: "destructive",
      });
    } else {
      setLocations((data || []) as Location[]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "city",
      description: "",
      x_position: 50,
      y_position: 50,
      color: "",
    });
    setEditingLocation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }

    const locationData = {
      name: formData.name.trim(),
      type: formData.type,
      description: formData.description.trim(),
      x_position: formData.x_position,
      y_position: formData.y_position,
      color: formData.color || null,
    };

    if (editingLocation) {
      const { error } = await supabase
        .from("world_locations")
        .update(locationData)
        .eq("id", editingLocation.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update location",
          variant: "destructive",
        });
      } else {
        toast({ title: "Location updated successfully" });
        fetchLocations();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("world_locations")
        .insert([locationData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create location",
          variant: "destructive",
        });
      } else {
        toast({ title: "Location created successfully" });
        fetchLocations();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      description: location.description || "",
      x_position: location.x_position,
      y_position: location.y_position,
      color: location.color || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    const { error } = await supabase
      .from("world_locations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    } else {
      toast({ title: "Location deleted successfully" });
      fetchLocations();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          World Locations Manager
        </CardTitle>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Edit Location" : "Add New Location"}
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
                    placeholder="Location name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Location description and lore"
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label>Map Position</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>X Position</span>
                      <span>{formData.x_position}%</span>
                    </div>
                    <Slider
                      value={[formData.x_position]}
                      onValueChange={([value]) => setFormData({ ...formData, x_position: value })}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Y Position</span>
                      <span>{formData.y_position}%</span>
                    </div>
                    <Slider
                      value={[formData.y_position]}
                      onValueChange={([value]) => setFormData({ ...formData, y_position: value })}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
                {/* Mini preview */}
                <div className="relative w-full h-32 bg-muted rounded-lg border overflow-hidden">
                  <div
                    className="absolute w-4 h-4 rounded-full bg-primary transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg"
                    style={{
                      left: `${formData.x_position}%`,
                      top: `${formData.y_position}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Custom Color (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., hsl(45, 93%, 47%)"
                  />
                  <div 
                    className="w-10 h-10 rounded border"
                    style={{ backgroundColor: formData.color || typeColors[formData.type] }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use default color for type
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLocation ? "Update Location" : "Add Location"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading locations...</div>
        ) : locations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No locations yet. Add your first location to populate the world map.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="capitalize"
                      style={{
                        borderColor: location.color || typeColors[location.type],
                        color: location.color || typeColors[location.type],
                      }}
                    >
                      {location.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    ({location.x_position}%, {location.y_position}%)
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {location.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(location)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(location.id)}
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
