import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
  FileText,
  Megaphone,
} from "lucide-react";
import { format, parseISO, isBefore, isAfter } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ScheduledContent {
  id: string;
  title: string;
  content: string;
  content_type: "almanac" | "announcement";
  category?: string;
  scheduled_for: string;
  status: "pending" | "published" | "cancelled";
  created_at: string;
  published_at?: string;
}

// Mock data since we don't have a scheduled_content table
const mockScheduledContent: ScheduledContent[] = [];

export const ContentScheduler = () => {
  const [scheduledItems, setScheduledItems] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledContent | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    content_type: "announcement" as "almanac" | "announcement",
    category: "",
    scheduled_date: "",
    scheduled_time: "",
  });

  useEffect(() => {
    fetchScheduledContent();
  }, []);

  const fetchScheduledContent = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from a scheduled_content table
      // For now, we'll use localStorage to persist scheduled items
      const stored = localStorage.getItem("scheduled_content");
      if (stored) {
        const items = JSON.parse(stored) as ScheduledContent[];
        // Check and update status based on time
        const updatedItems = items.map((item) => {
          if (item.status === "pending" && isBefore(parseISO(item.scheduled_for), new Date())) {
            return { ...item, status: "published" as const, published_at: item.scheduled_for };
          }
          return item;
        });
        setScheduledItems(updatedItems);
        localStorage.setItem("scheduled_content", JSON.stringify(updatedItems));
      }
    } catch (error) {
      console.error("Error fetching scheduled content:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveToStorage = (items: ScheduledContent[]) => {
    localStorage.setItem("scheduled_content", JSON.stringify(items));
    setScheduledItems(items);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.scheduled_date || !formData.scheduled_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const scheduledFor = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      
      if (isBefore(scheduledFor, new Date())) {
        toast({
          title: "Error",
          description: "Scheduled time must be in the future",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      if (editingItem) {
        // Update existing
        const updatedItems = scheduledItems.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                title: formData.title,
                content: formData.content,
                content_type: formData.content_type,
                category: formData.category,
                scheduled_for: scheduledFor.toISOString(),
              }
            : item
        );
        saveToStorage(updatedItems);
        toast({
          title: "Updated",
          description: "Scheduled content has been updated",
        });
      } else {
        // Create new
        const newItem: ScheduledContent = {
          id: crypto.randomUUID(),
          title: formData.title,
          content: formData.content,
          content_type: formData.content_type,
          category: formData.category,
          scheduled_for: scheduledFor.toISOString(),
          status: "pending",
          created_at: new Date().toISOString(),
        };
        saveToStorage([...scheduledItems, newItem]);
        toast({
          title: "Scheduled",
          description: `Content will be published on ${format(scheduledFor, "PPP 'at' p")}`,
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to schedule content",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: ScheduledContent) => {
    const scheduledDate = parseISO(item.scheduled_for);
    setFormData({
      title: item.title,
      content: item.content,
      content_type: item.content_type,
      category: item.category || "",
      scheduled_date: format(scheduledDate, "yyyy-MM-dd"),
      scheduled_time: format(scheduledDate, "HH:mm"),
    });
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this scheduled content?")) return;
    const updatedItems = scheduledItems.filter((item) => item.id !== id);
    saveToStorage(updatedItems);
    toast({
      title: "Deleted",
      description: "Scheduled content has been removed",
    });
  };

  const handleCancel = (id: string) => {
    const updatedItems = scheduledItems.map((item) =>
      item.id === id ? { ...item, status: "cancelled" as const } : item
    );
    saveToStorage(updatedItems);
    toast({
      title: "Cancelled",
      description: "Scheduled content has been cancelled",
    });
  };

  const handlePublishNow = async (item: ScheduledContent) => {
    setSubmitting(true);
    try {
      // In a real implementation, this would create the actual content
      // For announcements, it might send notifications
      // For almanac entries, it would insert into the appropriate table
      
      const updatedItems = scheduledItems.map((i) =>
        i.id === item.id
          ? { ...i, status: "published" as const, published_at: new Date().toISOString() }
          : i
      );
      saveToStorage(updatedItems);
      
      toast({
        title: "Published",
        description: "Content has been published successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish content",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      content_type: "announcement",
      category: "",
      scheduled_date: "",
      scheduled_time: "",
    });
    setEditingItem(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case "published":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return null;
    }
  };

  const pendingItems = scheduledItems.filter((i) => i.status === "pending");
  const publishedItems = scheduledItems.filter((i) => i.status === "published");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Content Scheduler
          </h3>
          <p className="text-sm text-muted-foreground">
            Schedule almanac entries and announcements for future publication
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Scheduled Content" : "Schedule New Content"}</DialogTitle>
              <DialogDescription>
                Set up content to be published at a specific date and time
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(v) => setFormData({ ...formData, content_type: v as typeof formData.content_type })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4" />
                          Announcement
                        </div>
                      </SelectItem>
                      <SelectItem value="almanac">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Almanac Entry
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.content_type === "almanac" && (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kingdoms">Kingdoms</SelectItem>
                        <SelectItem value="characters">Characters</SelectItem>
                        <SelectItem value="relics">Relics</SelectItem>
                        <SelectItem value="races">Races</SelectItem>
                        <SelectItem value="locations">Locations</SelectItem>
                        <SelectItem value="magic">Magic</SelectItem>
                        <SelectItem value="concepts">Concepts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter content..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scheduled Date *</Label>
                  <Input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scheduled Time *</Label>
                  <Input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingItem ? "Update" : "Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingItems.length}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedItems.length}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledItems.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Content</CardTitle>
          <CardDescription>Manage your upcoming publications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : scheduledItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled content yet</p>
              <p className="text-sm">Click "Schedule Content" to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledItems
                  .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.content_type === "almanac" ? (
                            <><FileText className="w-3 h-3 mr-1" />{item.category || "Almanac"}</>
                          ) : (
                            <><Megaphone className="w-3 h-3 mr-1" />Announcement</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(parseISO(item.scheduled_for), "PPP 'at' p")}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePublishNow(item)}
                                title="Publish now"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancel(item.id)}
                                className="text-destructive"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  );
};
