import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  Search,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Ban,
  MessageSquare,
  Palette,
  Star,
  Clock,
  Loader2,
  RefreshCw,
  Filter,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ModerationItem {
  id: string;
  type: "submission" | "comment" | "review";
  content: {
    id: string;
    title?: string;
    text: string;
    imageUrl?: string;
  };
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  reportCount: number;
  reports: {
    reason: string;
    reportedBy: string;
    reportedAt: string;
  }[];
  status: "pending" | "approved" | "removed" | "warned";
  priority: "low" | "medium" | "high";
  createdAt: string;
}

interface ModerationStats {
  pendingCount: number;
  approvedToday: number;
  removedToday: number;
  flaggedUsers: number;
}

export const ModerationQueue = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ModerationStats>({
    pendingCount: 0,
    approvedToday: 0,
    removedToday: 0,
    flaggedUsers: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [moderationNote, setModerationNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "submissions" | "comments" | "reviews">("all");

  useEffect(() => {
    fetchModerationQueue();
  }, []);

  const fetchModerationQueue = async () => {
    setLoading(true);
    try {
      // Fetch pending submissions
      const { data: submissions } = await supabase
        .from("user_submissions")
        .select("id, title, description, content_type, image_url, user_id, created_at, status")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // Fetch user profiles
      const userIds = submissions?.map((s) => s.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Transform submissions to moderation items
      const moderationItems: ModerationItem[] = (submissions || []).map((sub) => ({
        id: sub.id,
        type: "submission" as const,
        content: {
          id: sub.id,
          title: sub.title,
          text: sub.description || "",
          imageUrl: sub.image_url || undefined,
        },
        author: {
          id: sub.user_id,
          username: profileMap.get(sub.user_id)?.username || "Unknown",
          avatarUrl: profileMap.get(sub.user_id)?.avatar_url || null,
        },
        reportCount: 0,
        reports: [],
        status: "pending" as const,
        priority: "medium" as const,
        createdAt: sub.created_at,
      }));

      setItems(moderationItems);
      setStats({
        pendingCount: moderationItems.length,
        approvedToday: 0,
        removedToday: 0,
        flaggedUsers: 0,
      });
    } catch (error) {
      console.error("Error fetching moderation queue:", error);
      toast({
        title: "Error",
        description: "Failed to load moderation queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ModerationItem) => {
    setProcessing(true);
    try {
      if (item.type === "submission") {
        const { error } = await supabase
          .from("user_submissions")
          .update({ status: "approved", admin_notes: moderationNote || null })
          .eq("id", item.content.id);

        if (error) throw error;

        // Create notification
        await supabase.from("submission_notifications").insert({
          user_id: item.author.id,
          submission_id: item.content.id,
          type: "approved",
          message: `Your submission "${item.content.title}" has been approved!`,
          admin_notes: moderationNote || null,
        });
      }

      toast({
        title: "Approved",
        description: "Content has been approved and is now visible",
      });

      setSelectedItem(null);
      setModerationNote("");
      fetchModerationQueue();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to approve content",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (item: ModerationItem) => {
    if (!moderationNote.trim()) {
      toast({
        title: "Note required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      if (item.type === "submission") {
        const { error } = await supabase
          .from("user_submissions")
          .update({ status: "rejected", admin_notes: moderationNote })
          .eq("id", item.content.id);

        if (error) throw error;

        // Create notification
        await supabase.from("submission_notifications").insert({
          user_id: item.author.id,
          submission_id: item.content.id,
          type: "rejected",
          message: `Your submission "${item.content.title}" was not approved.`,
          admin_notes: moderationNote,
        });
      }

      toast({
        title: "Rejected",
        description: "Content has been rejected",
      });

      setSelectedItem(null);
      setModerationNote("");
      fetchModerationQueue();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject content",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickApprove = async (item: ModerationItem) => {
    setSelectedItem(item);
    await handleApprove(item);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive"><AlertOctagon className="w-3 h-3 mr-1" />High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "submission":
        return <Palette className="w-4 h-4" />;
      case "comment":
        return <MessageSquare className="w-4 h-4" />;
      case "review":
        return <Star className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.content.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "all" || item.type === activeTab.slice(0, -1);

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderation Queue
          </h3>
          <p className="text-sm text-muted-foreground">
            Review and moderate community submissions
          </p>
        </div>
        <Button variant="outline" onClick={fetchModerationQueue}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
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
                <p className="text-2xl font-bold">{stats.approvedToday}</p>
                <p className="text-sm text-muted-foreground">Approved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.removedToday}</p>
                <p className="text-sm text-muted-foreground">Removed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Flag className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.flaggedUsers}</p>
                <p className="text-sm text-muted-foreground">Flagged Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search content or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Items to Review ({filteredItems.length})</CardTitle>
          <CardDescription>Review content before it becomes publicly visible</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Queue is empty!</p>
              <p className="text-sm">All content has been reviewed</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Author */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={item.author.avatarUrl || undefined} />
                        <AvatarFallback>{item.author.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.author.username}</span>
                          <Badge variant="outline" className="capitalize">
                            {getTypeIcon(item.type)}
                            <span className="ml-1">{item.type}</span>
                          </Badge>
                          {getPriorityBadge(item.priority)}
                          {item.reportCount > 0 && (
                            <Badge variant="destructive">
                              <Flag className="w-3 h-3 mr-1" />
                              {item.reportCount} reports
                            </Badge>
                          )}
                        </div>

                        {item.content.title && (
                          <h4 className="font-semibold mb-1">{item.content.title}</h4>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.content.text}
                        </p>

                        {item.content.imageUrl && (
                          <img
                            src={item.content.imageUrl}
                            alt="Content preview"
                            className="mt-2 h-24 w-auto rounded-md object-cover"
                          />
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted {format(new Date(item.createdAt), "PPP 'at' p")}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleQuickApprove(item)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedItem(item)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="h-4 w-4 mr-2" />
                              Ban User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Content</DialogTitle>
            <DialogDescription>
              Review this submission and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedItem.author.avatarUrl || undefined} />
                  <AvatarFallback>{selectedItem.author.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedItem.author.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedItem.createdAt), "PPP 'at' p")}
                  </p>
                </div>
              </div>

              {selectedItem.content.title && (
                <h3 className="text-lg font-semibold">{selectedItem.content.title}</h3>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{selectedItem.content.text}</p>
              </div>

              {selectedItem.content.imageUrl && (
                <img
                  src={selectedItem.content.imageUrl}
                  alt="Content"
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Moderation Note</label>
                <Textarea
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="Add a note (required for rejection)..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && handleReject(selectedItem)}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <ThumbsDown className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => selectedItem && handleApprove(selectedItem)}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <ThumbsUp className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
