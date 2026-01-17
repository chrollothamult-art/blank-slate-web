import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Check,
  X,
  Eye,
  Trash2,
  Palette,
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  CheckSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type ContentType = Database['public']['Enums']['content_type'];
type ContentStatus = Database['public']['Enums']['content_status'];

interface Submission {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  image_url: string | null;
  status: ContentStatus;
  rating: number | null;
  admin_notes: string | null;
  is_featured: boolean;
  created_at: string;
  author?: {
    username: string;
    avatar_url: string | null;
  };
}

const contentTypeIcons = {
  art: Palette,
  discussion: MessageSquare,
  review: Star,
};

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export const SubmissionsManager = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchSubmissions = async (status: ContentStatus) => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const { data, error } = await supabase
        .from('user_submissions')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Fetch author profiles
      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedSubmissions: Submission[] = data.map(sub => ({
        ...sub,
        is_featured: (sub as any).is_featured || false,
        author: profileMap.get(sub.user_id) ? {
          username: profileMap.get(sub.user_id)!.username,
          avatar_url: profileMap.get(sub.user_id)!.avatar_url,
        } : undefined,
      }));

      setSubmissions(enrichedSubmissions);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(activeTab);
  }, [activeTab]);

  const createNotification = async (
    userId: string,
    submissionId: string,
    type: 'approved' | 'rejected' | 'featured',
    message: string,
    notes?: string
  ) => {
    try {
      await supabase.from('submission_notifications').insert({
        user_id: userId,
        submission_id: submissionId,
        type,
        message,
        admin_notes: notes || null,
      });
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  const handleApprove = async (submission: Submission) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_submissions')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
        })
        .eq('id', submission.id);

      if (error) throw error;

      // Create notification
      await createNotification(
        submission.user_id,
        submission.id,
        'approved',
        `Your submission "${submission.title}" has been approved!`,
        adminNotes
      );

      toast({
        title: 'Approved',
        description: 'Submission has been approved and is now visible',
      });

      setSelectedSubmission(null);
      setAdminNotes('');
      fetchSubmissions(activeTab);
    } catch (err: any) {
      console.error('Error approving:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve submission',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (submission: Submission) => {
    if (!adminNotes.trim()) {
      toast({
        title: 'Notes required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_submissions')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
        })
        .eq('id', submission.id);

      if (error) throw error;

      // Create notification
      await createNotification(
        submission.user_id,
        submission.id,
        'rejected',
        `Your submission "${submission.title}" was not approved.`,
        adminNotes
      );

      toast({
        title: 'Rejected',
        description: 'Submission has been rejected',
      });

      setSelectedSubmission(null);
      setAdminNotes('');
      fetchSubmissions(activeTab);
    } catch (err: any) {
      console.error('Error rejecting:', err);
      toast({
        title: 'Error',
        description: 'Failed to reject submission',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (submission: Submission) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_submissions')
        .delete()
        .eq('id', submission.id);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Submission has been permanently deleted',
      });

      setSelectedSubmission(null);
      fetchSubmissions(activeTab);
    } catch (err: any) {
      console.error('Error deleting:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete submission',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleFeatured = async (submission: Submission) => {
    setProcessing(true);
    try {
      const newFeaturedState = !submission.is_featured;
      const { error } = await supabase
        .from('user_submissions')
        .update({
          is_featured: newFeaturedState,
          featured_at: newFeaturedState ? new Date().toISOString() : null,
        })
        .eq('id', submission.id);

      if (error) throw error;

      if (newFeaturedState) {
        // Create notification
        await createNotification(
          submission.user_id,
          submission.id,
          'featured',
          `Congratulations! Your submission "${submission.title}" has been featured!`,
          null
        );
      }

      toast({
        title: newFeaturedState ? 'Featured' : 'Unfeatured',
        description: newFeaturedState
          ? 'Submission is now featured on the community page'
          : 'Submission removed from featured',
      });

      setSelectedSubmission(null);
      fetchSubmissions(activeTab);
    } catch (err: any) {
      console.error('Error toggling featured:', err);
      toast({
        title: 'Error',
        description: 'Failed to update featured status',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSubmissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubmissions.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    
    setBulkProcessing(true);
    try {
      const selectedSubmissions = submissions.filter(s => selectedIds.has(s.id));
      
      const { error } = await supabase
        .from('user_submissions')
        .update({ status: 'approved' })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      // Create notifications for all
      await Promise.all(
        selectedSubmissions.map(sub =>
          createNotification(
            sub.user_id,
            sub.id,
            'approved',
            `Your submission "${sub.title}" has been approved!`,
            null
          )
        )
      );

      toast({
        title: 'Bulk approved',
        description: `${selectedIds.size} submissions have been approved`,
      });

      setSelectedIds(new Set());
      fetchSubmissions(activeTab);
    } catch (err: any) {
      console.error('Error bulk approving:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve submissions',
        variant: 'destructive',
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    
    setBulkProcessing(true);
    try {
      const selectedSubmissions = submissions.filter(s => selectedIds.has(s.id));
      
      const { error } = await supabase
        .from('user_submissions')
        .update({
          status: 'rejected',
          admin_notes: 'Bulk rejected by admin',
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      // Create notifications for all
      await Promise.all(
        selectedSubmissions.map(sub =>
          createNotification(
            sub.user_id,
            sub.id,
            'rejected',
            `Your submission "${sub.title}" was not approved.`,
            'Bulk rejected by admin'
          )
        )
      );

      toast({
        title: 'Bulk rejected',
        description: `${selectedIds.size} submissions have been rejected`,
      });

      setSelectedIds(new Set());
      fetchSubmissions(activeTab);
    } catch (err: any) {
      console.error('Error bulk rejecting:', err);
      toast({
        title: 'Error',
        description: 'Failed to reject submissions',
        variant: 'destructive',
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const filteredSubmissions = submissions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Icon = selectedSubmission ? contentTypeIcons[selectedSubmission.content_type] : null;
  const StatusIcon = selectedSubmission ? statusIcons[selectedSubmission.status] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Submissions</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentStatus)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="w-4 h-4" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Bulk Actions Bar */}
          {activeTab === 'pending' && filteredSubmissions.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 
                    ? `${selectedIds.size} selected`
                    : 'Select all'}
                </span>
              </div>
              
              {selectedIds.size > 0 && (
                <>
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={bulkProcessing}
                    className="gap-1"
                  >
                    {bulkProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckSquare className="w-4 h-4" />
                    )}
                    Approve Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkReject}
                    disabled={bulkProcessing}
                    className="gap-1"
                  >
                    {bulkProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Reject Selected
                  </Button>
                </>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No {activeTab} submissions found
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeTab === 'pending' && <TableHead className="w-12"></TableHead>}
                    <TableHead>Submission</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    {activeTab === 'approved' && <TableHead>Featured</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => {
                    const TypeIcon = contentTypeIcons[submission.content_type];
                    return (
                      <TableRow key={submission.id}>
                        {activeTab === 'pending' && (
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(submission.id)}
                              onCheckedChange={() => toggleSelect(submission.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {submission.image_url && (
                              <img
                                src={submission.image_url}
                                alt=""
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium line-clamp-1">{submission.title}</p>
                              {submission.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {submission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={submission.author?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {submission.author?.username?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {submission.author?.username || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <TypeIcon className="w-3 h-3" />
                            {submission.content_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(submission.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        {activeTab === 'approved' && (
                          <TableCell>
                            {submission.is_featured ? (
                              <Badge className="bg-amber-500 text-white gap-1">
                                <Crown className="w-3 h-3" />
                                Featured
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setAdminNotes(submission.admin_notes || '');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubmission(null);
            setAdminNotes('');
          }
        }}
      >
        {selectedSubmission && Icon && StatusIcon && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn('border', statusColors[selectedSubmission.status])}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {selectedSubmission.status}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Icon className="w-3 h-3" />
                  {selectedSubmission.content_type}
                </Badge>
                {selectedSubmission.is_featured && (
                  <Badge className="bg-amber-500 text-white gap-1">
                    <Crown className="w-3 h-3" />
                    Featured
                  </Badge>
                )}
              </div>
              <DialogTitle>{selectedSubmission.title}</DialogTitle>
              <DialogDescription>
                Submitted by {selectedSubmission.author?.username || 'Unknown'} on{' '}
                {format(new Date(selectedSubmission.created_at), 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedSubmission.image_url && (
                <img
                  src={selectedSubmission.image_url}
                  alt={selectedSubmission.title}
                  className="w-full max-h-64 object-contain rounded-lg bg-muted"
                />
              )}

              {selectedSubmission.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedSubmission.description}
                  </p>
                </div>
              )}

              {selectedSubmission.content_type === 'review' && selectedSubmission.rating && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Rating</h4>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < selectedSubmission.rating! ? 'fill-current' : ''
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Admin Notes</h4>
                <Textarea
                  placeholder="Add notes (required for rejection)..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedSubmission.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedSubmission)}
                    disabled={processing}
                    className="gap-2"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedSubmission)}
                    disabled={processing}
                    className="gap-2"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve
                  </Button>
                </>
              )}
              {selectedSubmission.status === 'approved' && (
                <Button
                  variant={selectedSubmission.is_featured ? 'outline' : 'default'}
                  onClick={() => handleToggleFeatured(selectedSubmission)}
                  disabled={processing}
                  className="gap-2"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Crown className="w-4 h-4" />
                  )}
                  {selectedSubmission.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => handleDelete(selectedSubmission)}
                disabled={processing}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
