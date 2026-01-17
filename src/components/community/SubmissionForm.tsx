import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, MessageSquare, Star, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissions } from '@/hooks/useSubmissions';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ContentType = Database['public']['Enums']['content_type'];
type TagType = Database['public']['Enums']['tag_type'];

interface Tag {
  id: string;
  name: string;
  type: TagType;
}

interface SubmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const contentTypes: { value: ContentType; label: string; icon: typeof Palette; description: string }[] = [
  { value: 'art', label: 'Fan Art', icon: Palette, description: 'Share your artwork inspired by the books' },
  { value: 'discussion', label: 'Discussion', icon: MessageSquare, description: 'Start a conversation about the story' },
  { value: 'review', label: 'Review', icon: Star, description: 'Share your thoughts on characters or events' },
];

export const SubmissionForm = ({ open, onOpenChange }: SubmissionFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createSubmission } = useSubmissions();

  const [contentType, setContentType] = useState<ContentType>('art');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagSearch, setTagSearch] = useState('');

  // Fetch available tags (characters, events, etc.)
  useEffect(() => {
    const fetchTags = async () => {
      try {
        // Fetch characters
        const { data: characters } = await supabase
          .from('almanac_characters')
          .select('id, name')
          .limit(100);

        // Fetch chronology events
        const { data: events } = await supabase
          .from('chronology_events')
          .select('id, title')
          .limit(100);

        const tags: Tag[] = [
          ...(characters?.map(c => ({ id: c.id, name: c.name, type: 'character' as TagType })) || []),
          ...(events?.map(e => ({ id: e.id, name: e.title, type: 'event' as TagType })) || []),
        ];

        setAvailableTags(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    if (open) {
      fetchTags();
    }
  }, [open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const toggleTag = (tag: Tag) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
    } else if (selectedTags.length < 5) {
      setSelectedTags(prev => [...prev, tag]);
    } else {
      toast({
        title: 'Maximum tags reached',
        description: 'You can select up to 5 tags',
        variant: 'destructive',
      });
    }
  };

  const filteredTags = availableTags.filter(
    tag =>
      tag.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
      !selectedTags.find(t => t.id === tag.id)
  );

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit content',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your submission',
        variant: 'destructive',
      });
      return;
    }

    if (contentType === 'art' && !imageFile) {
      toast({
        title: 'Image required',
        description: 'Please upload an image for fan art submissions',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl: string | undefined;

      // Upload image if present
      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        setUploading(false);
      }

      // Create submission
      const tagsToSubmit = selectedTags.map(tag => ({
        tag_id: tag.id,
        tag_name: tag.name,
        tag_type: tag.type,
      }));

      const submission = await createSubmission(
        title,
        contentType,
        description || undefined,
        imageUrl,
        contentType === 'review' ? rating : undefined,
        tagsToSubmit
      );

      if (submission) {
        onOpenChange(false);
        resetForm();
        navigate('/community');
      }
    } catch (error: any) {
      console.error('Error submitting:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit content',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setContentType('art');
    setTitle('');
    setDescription('');
    setRating(5);
    setImageFile(null);
    setImagePreview(null);
    setSelectedTags([]);
    setTagSearch('');
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              Please sign in to submit your content to the community gallery.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit to Community</DialogTitle>
          <DialogDescription>
            Share your fan art, start a discussion, or write a review. All submissions are reviewed before appearing in the gallery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Content Type Selection */}
          <div className="space-y-2">
            <Label>What are you sharing?</Label>
            <div className="grid grid-cols-3 gap-3">
              {contentTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    contentType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setContentType(type.value)}
                >
                  <CardContent className="p-4 text-center">
                    <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                      contentType === type.value ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="font-medium text-sm">{type.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your submission a title"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us more about your submission..."
              rows={4}
              maxLength={2000}
            />
          </div>

          {/* Image Upload (for art) */}
          {contentType === 'art' && (
            <div className="space-y-2">
              <Label>Upload Image *</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg bg-muted"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload (max 5MB)</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          )}

          {/* Rating (for reviews) */}
          {contentType === 'review' && (
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select value={rating.toString()} onValueChange={(v) => setRating(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <SelectItem key={r} value={r.toString()}>
                      {'★'.repeat(r)}{'☆'.repeat(5 - r)} ({r}/5)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tag Characters or Events (optional)</Label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Tag Search */}
            <Input
              placeholder="Search characters or events..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
            />

            {/* Tag Suggestions */}
            {tagSearch && filteredTags.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-muted/50">
                {filteredTags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      toggleTag(tag);
                      setTagSearch('');
                    }}
                  >
                    {tag.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({tag.type})
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || uploading}>
            {submitting || uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploading ? 'Uploading...' : 'Submitting...'}
              </>
            ) : (
              'Submit for Review'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
