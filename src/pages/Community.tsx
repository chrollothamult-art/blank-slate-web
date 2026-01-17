import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import SmoothTab, { TabItem } from '@/components/ui/smooth-tab';
import { Avatar } from '@/components/ui/avatar';
import {
  Search,
  Plus,
  Palette,
  MessageSquare,
  Star,
  TrendingUp,
  Clock,
  Sparkles,
  ImageIcon,
  ThumbsUp,
  MessageCircle,
  X,
  Filter,
  Users,
  Edit,
  Trash2,
  Save,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { SubmissionCard } from '@/components/community/SubmissionCard';
import { SubmissionForm } from '@/components/community/SubmissionForm';
import { FeaturedSubmissions } from '@/components/community/FeaturedSubmissions';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

type ContentType = Database['public']['Enums']['content_type'];

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

const forumCategories = [
  "All",
  "Book Discussion", 
  "Recommendations",
  "Challenges",
  "Author Spotlight",
  "Reading Tips",
  "General"
];

const ITEMS_PER_PAGE = 10;

const filterOptions: { value: ContentType | 'all'; label: string; icon: typeof Palette }[] = [
  { value: 'all', label: 'All', icon: Sparkles },
  { value: 'art', label: 'Fan Art', icon: Palette },
  { value: 'review', label: 'Reviews', icon: Star },
];

export const Community = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // Main tab state - gallery or discussions
  const [mainTab, setMainTab] = useState<'gallery' | 'discussions'>('gallery');
  
  // Gallery state
  const [activeFilter, setActiveFilter] = useState<ContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  // Forum state
  const [forumSearchQuery, setForumSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [forumLoading, setForumLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostData, setNewPostData] = useState({
    title: "",
    category: "Book Discussion",
    content: "",
  });
  const [forumStats, setForumStats] = useState({
    totalPosts: 0,
    totalMembers: 0,
    activeToday: 0,
    newThisWeek: 0,
  });

  const { submissions, loading, toggleLike, deleteSubmission, refetch } = useSubmissions({
    contentType: activeFilter,
    status: 'approved',
  });

  // Fetch forum data when discussions tab is active
  useEffect(() => {
    if (mainTab === 'discussions') {
      fetchPosts();
      fetchForumStats();
    }
  }, [mainTab]);

  const fetchPosts = async () => {
    try {
      setForumLoading(true);
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

      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from("forum_likes")
          .select("post_id")
          .eq("user_id", user.id);
        userLikes = likesData?.map((like) => like.post_id) || [];
      }

      const formattedPosts = (data || []).map((post: any) => ({
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
    } finally {
      setForumLoading(false);
    }
  };

  const fetchForumStats = async () => {
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

      setForumStats({
        totalPosts: postsCount.count || 0,
        totalMembers: profilesCount.count || 0,
        activeToday: Math.floor((profilesCount.count || 0) * 0.12),
        newThisWeek: newThisWeek || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Gallery filtering
  const filteredSubmissions = submissions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tags.some((t) => t.tag_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.likes_count - a.likes_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Forum filtering
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
      const matchesSearch =
        post.title.toLowerCase().includes(forumSearchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(forumSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, forumSearchQuery]);

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, forumSearchQuery]);

  const galleryStats = {
    totalArt: submissions.filter((s) => s.content_type === 'art').length,
    totalDiscussions: forumStats.totalPosts,
    totalReviews: submissions.filter((s) => s.content_type === 'review').length,
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
        description: "Your discussion has been created",
      });

      setShowNewPost(false);
      setNewPostData({ title: "", category: "Book Discussion", content: "" });
      fetchPosts();
      fetchForumStats();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create discussion",
        variant: "destructive",
      });
    }
  };

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
        await supabase
          .from("forum_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("forum_likes")
          .insert({ post_id: postId, user_id: user.id });
      }
      fetchPosts();
    } catch (error: any) {
      console.error("Error liking post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this discussion?")) return;

    try {
      const { error } = await supabase
        .from("forum_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({ title: "Success", description: "Discussion deleted" });
      fetchPosts();
      fetchForumStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete discussion",
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pages.map((page, idx) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Community Hub
            </Badge>
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              Fan Creations & Discussions
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Share your fan art, start discussions, and connect with fellow ThouArt enthusiasts.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-primary">{galleryStats.totalArt}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Artworks</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-primary">{galleryStats.totalDiscussions}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Discussions</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-primary">{galleryStats.totalReviews}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-primary">{forumStats.totalMembers}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Main Tabs - Gallery vs Discussions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <SmoothTab
            items={[
              { id: 'gallery', title: 'Gallery', icon: Palette },
              { id: 'discussions', title: 'Discussions', icon: MessageSquare },
            ]}
            defaultTabId={mainTab}
            onChange={(tabId) => setMainTab(tabId as 'gallery' | 'discussions')}
          />

          {mainTab === 'gallery' && (
            <Button
              onClick={() => user ? setShowSubmitForm(true) : navigate('/auth')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Creation
            </Button>
          )}
          {mainTab === 'discussions' && (
            <Button onClick={handleNewPost} className="gap-2">
              <Plus className="w-4 h-4" />
              New Discussion
            </Button>
          )}
        </div>

        {/* Gallery Tab Content */}
        {mainTab === 'gallery' && (
          <div className="space-y-6">
            <FeaturedSubmissions />

            {/* Gallery Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <SmoothTab
                  items={filterOptions.map((option) => ({
                    id: option.value,
                    title: option.label,
                    icon: option.icon,
                  }))}
                  defaultTabId={activeFilter}
                  onChange={(v) => setActiveFilter(v as ContentType | 'all')}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={sortBy === 'recent' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('recent')}
                  className="gap-1"
                >
                  <Clock className="w-4 h-4" />
                  Recent
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('popular')}
                  className="gap-1"
                >
                  <TrendingUp className="w-4 h-4" />
                  Popular
                </Button>
              </div>
            </div>

            {/* Gallery Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : sortedSubmissions.length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? 'No results found' : 'Be the first to share your creation!'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => user ? setShowSubmitForm(true) : navigate('/auth')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Your Creation
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedSubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    onLike={toggleLike}
                    onDelete={user?.id === submission.user_id ? deleteSubmission : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discussions Tab Content */}
        {mainTab === 'discussions' && (
          <div className="space-y-6">
            {/* New Discussion Form */}
            {showNewPost && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Start a Discussion</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowNewPost(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <Input
                    placeholder="Discussion title..."
                    value={newPostData.title}
                    onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
                  />
                  <select
                    value={newPostData.category}
                    onChange={(e) => setNewPostData({ ...newPostData, category: e.target.value })}
                    className="w-full border border-input bg-background px-3 py-2 rounded-md text-sm"
                  >
                    {forumCategories.filter(c => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPostData.content}
                    onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewPost(false)}>Cancel</Button>
                    <Button onClick={handleCreatePost}>
                      <Save className="w-4 h-4 mr-2" />
                      Post Discussion
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Discussion Filters */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar */}
              <div className="lg:w-1/4 space-y-4">
                <Card className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search discussions..."
                      value={forumSearchQuery}
                      onChange={(e) => setForumSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {forumCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedCategory === category
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Guidelines</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Be respectful and kind</li>
                    <li>• No spoilers without warnings</li>
                    <li>• Stay on topic</li>
                    <li>• No spam or self-promotion</li>
                  </ul>
                </Card>
              </div>

              {/* Posts List */}
              <div className="lg:w-3/4 space-y-4">
                {forumLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="flex items-start space-x-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : filteredPosts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                    <p className="text-muted-foreground mb-4">Be the first to start a conversation!</p>
                    <Button onClick={handleNewPost}>
                      <Plus className="w-4 h-4 mr-2" />
                      Start Discussion
                    </Button>
                  </Card>
                ) : (
                  <>
                    {paginatedPosts.map((post) => (
                      <Card key={post.id} className="p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-accent">
                              {post.author_username.charAt(0).toUpperCase()}
                            </span>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {post.is_sticky && (
                                <Badge variant="secondary" className="text-xs">Pinned</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">{post.category}</Badge>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-lg hover:text-accent cursor-pointer line-clamp-1">
                                {post.title}
                              </h3>
                              {user?.id === post.author_id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePost(post.id)}
                                  className="h-8 w-8 text-destructive flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                              {post.content}
                            </p>

                            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <span>{post.author_username}</span>
                                <span>{formatDate(post.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => handleLikePost(post.id, post.user_has_liked || false)}
                                  className={`flex items-center gap-1 hover:text-accent transition-colors ${
                                    post.user_has_liked ? 'text-accent' : ''
                                  }`}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  {post.likes_count}
                                </button>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-4 w-4" />
                                  {post.replies_count}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {renderPagination()}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Form Modal */}
      <SubmissionForm open={showSubmitForm} onOpenChange={setShowSubmitForm} />

      <Footer />
    </div>
  );
};

export default Community;