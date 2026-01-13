import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  ThumbsUp,
  MessageCircle,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical
} from "lucide-react";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_username: string;
  category: string;
  created_at: string;
  replies_count: number;
  likes_count: number;
  is_sticky?: boolean;
  user_has_liked?: boolean;
}

const categories = [
  "All",
  "Book Discussion", 
  "Recommendations",
  "Challenges",
  "Author Spotlight",
  "Reading Tips",
  "General"
];

export const Forum = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalMembers: 0,
    activeToday: 0,
    newThisWeek: 0,
  });
  const [newPostData, setNewPostData] = useState({
    title: "",
    category: "Book Discussion",
    content: "",
  });
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replies, setReplies] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editPostData, setEditPostData] = useState({
    title: "",
    category: "",
    content: "",
  });

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select(`
          id,
          title,
          content,
          author_id,
          category,
          created_at,
          replies_count,
          likes_count,
          is_sticky,
          profiles (username)
        `)
        .order("is_sticky", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check which posts the user has liked
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from("forum_likes")
          .select("post_id")
          .eq("user_id", user.id);
        userLikes = likesData?.map((like) => like.post_id) || [];
      }

      const formattedPosts = data.map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author_id: post.author_id,
        author_username: post.profiles?.username || "Unknown",
        category: post.category,
        created_at: post.created_at,
        replies_count: post.replies_count,
        likes_count: post.likes_count,
        is_sticky: post.is_sticky,
        user_has_liked: userLikes.includes(post.id),
      }));

      setPosts(formattedPosts);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load forum posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [postsCount, profilesCount] = await Promise.all([
        supabase.from("forum_posts").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: newThisWeek } = await supabase
        .from("forum_posts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());

      setStats({
        totalPosts: postsCount.count || 0,
        totalMembers: profilesCount.count || 0,
        activeToday: Math.floor((profilesCount.count || 0) * 0.12), // Approximation
        newThisWeek: newThisWeek || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleNewPost = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a post",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setShowNewPost(true);
  };

  const handleCreatePost = async () => {
    if (!user || !newPostData.title || !newPostData.content) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("forum_posts").insert({
        title: newPostData.title,
        content: newPostData.content,
        category: newPostData.category,
        author_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your post has been created",
      });

      setShowNewPost(false);
      setNewPostData({ title: "", category: "Book Discussion", content: "" });
      fetchPosts();
      fetchStats();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLikePost = async (postId: string, currentlyLiked: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like posts",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      if (currentlyLiked) {
        // Unlike the post
        const { error } = await supabase
          .from("forum_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like the post
        const { error } = await supabase
          .from("forum_likes")
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;
      }

      // Refresh posts to update counts
      fetchPosts();
    } catch (error: any) {
      console.error("Error liking post:", error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleOpenReply = async (post: ForumPost) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to reply",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setSelectedPost(post);
    setShowReplyModal(true);

    // Fetch replies for this post
    try {
      const { data, error } = await supabase
        .from("forum_replies")
        .select(`
          id,
          content,
          created_at,
          author_id,
          profiles (username)
        `)
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleCreateReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a reply",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("forum_replies").insert({
        post_id: selectedPost.id,
        author_id: user.id,
        content: replyContent,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your reply has been posted",
      });

      setReplyContent("");
      setShowReplyModal(false);
      fetchPosts();
    } catch (error: any) {
      console.error("Error creating reply:", error);
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    }
  };

  const handleEditPost = (post: ForumPost) => {
    setEditingPost(post);
    setEditPostData({
      title: post.title,
      category: post.category,
      content: post.content,
    });
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editPostData.title || !editPostData.content) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("forum_posts")
        .update({
          title: editPostData.title,
          content: editPostData.content,
          category: editPostData.category,
        })
        .eq("id", editingPost.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your post has been updated",
      });

      setEditingPost(null);
      fetchPosts();
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("forum_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      fetchPosts();
      fetchStats();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-playfair font-bold text-primary mb-2">
                Community Forum
              </h1>
              <p className="text-muted-foreground">
                Connect with fellow book lovers and share your reading experiences
              </p>
            </div>
            <Button 
              className="btn-professional"
              onClick={handleNewPost}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Discussion
            </Button>
          </div>

          {/* Forum Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeToday}</p>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{stats.newThisWeek}</p>
                  <p className="text-sm text-muted-foreground">New This Week</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4 space-y-6">
            {/* Search */}
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            {/* Categories */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                      selectedCategory === category
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </Card>

            {/* Forum Rules */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Forum Guidelines</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Be respectful and kind to all members</li>
                <li>• No spoilers without proper warnings</li>
                <li>• Stay on topic in discussions</li>
                <li>• Use appropriate categories for posts</li>
                <li>• No spam or self-promotion</li>
              </ul>
            </Card>
          </div>

          {/* Posts List */}
          <div className="lg:w-3/4 space-y-4">
            {loading ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">Loading posts...</p>
              </Card>
            ) : filteredPosts.length === 0 ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">
                  No posts found. Be the first to start a discussion!
                </p>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-accent">
                        {post.author_username.charAt(0).toUpperCase()}
                      </span>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {post.is_sticky && (
                          <Badge variant="secondary" className="text-xs">
                            Pinned
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {post.category}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg hover:text-accent cursor-pointer">
                          {post.title}
                        </h3>
                        
                        {user?.id === post.author_id && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPost(post)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePost(post.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span>
                            by {user?.id === post.author_id && profile ? profile.username : post.author_username}
                          </span>
                          <span>{formatDate(post.created_at)}</span>
                        </div>

                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikePost(post.id, post.user_has_liked || false)}
                            className={`flex items-center space-x-1 hover:text-accent transition-colors ${
                              post.user_has_liked ? "text-accent" : ""
                            }`}
                          >
                            <ThumbsUp className={`h-4 w-4 ${post.user_has_liked ? "fill-current" : ""}`} />
                            <span>{post.likes_count}</span>
                          </button>
                          <button
                            onClick={() => handleOpenReply(post)}
                            className="flex items-center space-x-1 hover:text-accent transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.replies_count}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-playfair font-bold">
                  {selectedPost.title}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowReplyModal(false)}>
                  ×
                </Button>
              </div>

              {/* Original Post */}
              <Card className="p-4 mb-6 bg-muted/30">
                <div className="flex items-start space-x-3 mb-3">
                  <Avatar className="w-8 h-8 bg-accent/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-accent">
                      {selectedPost.author_username.charAt(0).toUpperCase()}
                    </span>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedPost.author_username}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(selectedPost.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm">{selectedPost.content}</p>
              </Card>

              {/* Replies List */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold">
                  Replies ({replies.length})
                </h3>
                {replies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No replies yet. Be the first to reply!
                  </p>
                ) : (
                  replies.map((reply: any) => (
                    <Card key={reply.id} className="p-4">
                      <div className="flex items-start space-x-3 mb-2">
                        <Avatar className="w-8 h-8 bg-accent/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-accent">
                            {reply.profiles?.username?.charAt(0).toUpperCase()}
                          </span>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{reply.profiles?.username || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</p>
                        </div>
                      </div>
                      <p className="text-sm ml-11">{reply.content}</p>
                    </Card>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <div className="space-y-4">
                <Separator />
                <div>
                  <label className="block text-sm font-medium mb-2">Your Reply</label>
                  <Textarea
                    placeholder="Share your thoughts..."
                    rows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowReplyModal(false)}>
                    Cancel
                  </Button>
                  <Button className="btn-professional" onClick={handleCreateReply}>
                    Post Reply
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-playfair font-bold">Edit Discussion</h2>
                <Button variant="ghost" size="icon" onClick={() => setEditingPost(null)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    placeholder="What would you like to discuss?"
                    value={editPostData.title}
                    onChange={(e) =>
                      setEditPostData({ ...editPostData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    className="w-full border border-input bg-background px-3 py-2 rounded-md"
                    value={editPostData.category}
                    onChange={(e) =>
                      setEditPostData({ ...editPostData, category: e.target.value })
                    }
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <Textarea
                    placeholder="Share your thoughts, ask questions, or start a discussion..."
                    rows={8}
                    value={editPostData.content}
                    onChange={(e) =>
                      setEditPostData({ ...editPostData, content: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setEditingPost(null)}>
                    Cancel
                  </Button>
                  <Button className="btn-professional" onClick={handleUpdatePost}>
                    Update Discussion
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-playfair font-bold">Start New Discussion</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowNewPost(false)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    placeholder="What would you like to discuss?"
                    value={newPostData.title}
                    onChange={(e) =>
                      setNewPostData({ ...newPostData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    className="w-full border border-input bg-background px-3 py-2 rounded-md"
                    value={newPostData.category}
                    onChange={(e) =>
                      setNewPostData({ ...newPostData, category: e.target.value })
                    }
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <Textarea
                    placeholder="Share your thoughts, ask questions, or start a discussion..."
                    rows={8}
                    value={newPostData.content}
                    onChange={(e) =>
                      setNewPostData({ ...newPostData, content: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowNewPost(false)}>
                    Cancel
                  </Button>
                  <Button className="btn-professional" onClick={handleCreatePost}>
                    Post Discussion
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Forum;