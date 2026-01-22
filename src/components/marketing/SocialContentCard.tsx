import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Instagram, 
  MapPin, 
  Facebook, 
  MessageSquare,
  Linkedin,
  Video,
  Edit2,
  Trash2,
  Send,
  Check,
  Clock,
  Image as ImageIcon,
  Hash,
  Sparkles,
  Camera,
  Calendar,
} from 'lucide-react';
import { AIContentButton } from '@/components/ai/AIContentButton';
import { SchedulePostDialog } from './SchedulePostDialog';

export interface SocialContentDraft {
  id: string;
  company_id: string;
  job_assignment_id: string | null;
  image_url: string | null;
  platform: 'instagram' | 'google_business' | 'facebook' | 'sms' | 'tiktok' | 'linkedin';
  generated_content: string;
  edited_content: string | null;
  hashtags: string[] | null;
  media_instructions: string | null;
  api_metadata: {
    caption?: string;
    hashtags?: string[];
    commentary?: string;
    visibility?: string;
    title?: string;
    is_aigc?: boolean;
    summary?: string;
    call_to_action?: string;
    message?: string;
    template?: string;
  } | null;
  status: 'pending' | 'approved' | 'published' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SocialContentCardProps {
  draft: SocialContentDraft;
  onEdit: (draft: SocialContentDraft, newContent: string) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onSchedule?: (draft: SocialContentDraft, scheduledFor: Date, timezone: string) => void;
  isPublishing?: boolean;
}

const PLATFORM_CONFIG = {
  instagram: {
    icon: Instagram,
    label: 'Instagram',
    color: 'hsl(330, 70%, 55%)',
    bgClass: 'bg-[hsl(330,70%,50%)]/10',
    borderClass: 'border-[hsl(330,70%,50%)]/25',
    textClass: 'text-[hsl(330,70%,60%)]',
    iconBg: 'bg-[hsl(330,70%,50%)]/15',
    charLimit: 2200,
  },
  google_business: {
    icon: MapPin,
    label: 'Google Business',
    color: 'hsl(210, 80%, 55%)',
    bgClass: 'bg-[hsl(210,80%,50%)]/10',
    borderClass: 'border-[hsl(210,80%,50%)]/25',
    textClass: 'text-[hsl(210,80%,60%)]',
    iconBg: 'bg-[hsl(210,80%,50%)]/15',
    charLimit: 1500,
  },
  facebook: {
    icon: Facebook,
    label: 'Facebook',
    color: 'hsl(220, 70%, 55%)',
    bgClass: 'bg-[hsl(220,70%,50%)]/10',
    borderClass: 'border-[hsl(220,70%,50%)]/25',
    textClass: 'text-[hsl(220,70%,60%)]',
    iconBg: 'bg-[hsl(220,70%,50%)]/15',
    charLimit: 500,
  },
  sms: {
    icon: MessageSquare,
    label: 'SMS Template',
    color: 'hsl(145, 60%, 50%)',
    bgClass: 'bg-[hsl(145,60%,45%)]/10',
    borderClass: 'border-[hsl(145,60%,45%)]/25',
    textClass: 'text-[hsl(145,60%,55%)]',
    iconBg: 'bg-[hsl(145,60%,45%)]/15',
    charLimit: 160,
  },
  tiktok: {
    icon: Video,
    label: 'TikTok',
    color: 'hsl(340, 82%, 52%)',
    bgClass: 'bg-[hsl(340,82%,52%)]/10',
    borderClass: 'border-[hsl(340,82%,52%)]/25',
    textClass: 'text-[hsl(340,82%,60%)]',
    iconBg: 'bg-[hsl(340,82%,52%)]/15',
    charLimit: 2200,
  },
  linkedin: {
    icon: Linkedin,
    label: 'LinkedIn',
    color: 'hsl(210, 90%, 45%)',
    bgClass: 'bg-[hsl(210,90%,45%)]/10',
    borderClass: 'border-[hsl(210,90%,45%)]/25',
    textClass: 'text-[hsl(210,90%,55%)]',
    iconBg: 'bg-[hsl(210,90%,45%)]/15',
    charLimit: 3000,
  },
};

export function SocialContentCard({ 
  draft, 
  onEdit, 
  onDelete, 
  onApprove,
  onSchedule,
  isPublishing = false,
}: SocialContentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(draft.edited_content || draft.generated_content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const config = PLATFORM_CONFIG[draft.platform];
  const PlatformIcon = config.icon;
  const content = draft.edited_content || draft.generated_content;
  const charCount = content.length;
  const isOverLimit = charCount > config.charLimit;

  const handleSaveEdit = () => {
    onEdit(draft, editContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(draft.edited_content || draft.generated_content);
    setIsEditing(false);
  };

  const getStatusBadge = () => {
    switch (draft.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-status-pending/15 text-status-pending border-status-pending/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-info/15 text-info border-info/30"><Check className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-success/15 text-success border-success/30"><Send className="h-3 w-3 mr-1" /> Published</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">Rejected</Badge>;
      default:
        return null;
    }
  };

  // Check if TikTok has AI-generated content flag
  const isTikTokAIGC = draft.platform === 'tiktok' && draft.api_metadata?.is_aigc;

  return (
    <>
      <Card className={`overflow-hidden border ${config.borderClass} bg-card rounded-xl`}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-card-foreground/10">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${config.iconBg} border ${config.borderClass}`}>
                <PlatformIcon className={`h-4 w-4 ${config.textClass}`} />
              </div>
              <span className="font-medium text-sm text-card-foreground">{config.label}</span>
              {/* AI Generated Badge for TikTok */}
              {isTikTokAIGC && (
                <Badge variant="outline" className="text-xs bg-purple-500/15 text-purple-400 border-purple-500/30">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  AI Generated
                </Badge>
              )}
              {/* LinkedIn Visibility Badge */}
              {draft.platform === 'linkedin' && draft.api_metadata?.visibility && (
                <Badge variant="outline" className="text-xs bg-blue-500/15 text-blue-400 border-blue-500/30">
                  {draft.api_metadata.visibility}
                </Badge>
              )}
            </div>
            {getStatusBadge()}
          </div>

          {/* Image Preview */}
          {draft.image_url && draft.platform !== 'sms' && (
            <div className="relative aspect-video bg-muted/30">
              <img 
                src={draft.image_url} 
                alt="Job completion" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
            </div>
          )}

          {!draft.image_url && draft.platform !== 'sms' && (
            <div className="aspect-video bg-muted/20 flex items-center justify-center border-b border-card-foreground/10">
              <div className="text-center text-card-foreground/40">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span className="text-xs">No image</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-3 space-y-3">
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center justify-end mb-1">
                  <AIContentButton
                    contentType="social_content"
                    existingContent={editContent}
                    context={{ platform: draft.platform }}
                    onGenerate={(content) => setEditContent(content)}
                  />
                </div>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[120px] bg-muted/30 border-card-foreground/20 text-card-foreground text-sm resize-none"
                  placeholder="Edit content..."
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={isOverLimit ? 'text-destructive' : 'text-card-foreground/50'}>
                    {editContent.length} / {config.charLimit}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="text-card-foreground/70">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-card-foreground/80 line-clamp-4 whitespace-pre-wrap">
                  {content}
                </p>
                
                {/* Media Instructions */}
                {draft.media_instructions && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 border border-card-foreground/10">
                    <Camera className="h-3.5 w-3.5 text-card-foreground/50 mt-0.5 shrink-0" />
                    <p className="text-xs text-card-foreground/60 italic">
                      {draft.media_instructions}
                    </p>
                  </div>
                )}
                
                {/* Hashtags */}
                {draft.hashtags && draft.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {draft.hashtags.slice(0, 5).map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs bg-muted/30 border-card-foreground/15 text-card-foreground/60"
                      >
                        <Hash className="h-2.5 w-2.5 mr-0.5" />
                        {tag}
                      </Badge>
                    ))}
                    {draft.hashtags.length > 5 && (
                      <Badge variant="outline" className="text-xs bg-muted/30 border-card-foreground/15 text-card-foreground/60">
                        +{draft.hashtags.length - 5} more
                      </Badge>
                )}
                </div>
              )}

                <div className="flex items-center justify-between text-xs text-card-foreground/50">
                  <span className={isOverLimit ? 'text-destructive' : ''}>
                    {charCount} / {config.charLimit}
                  </span>
                </div>
              </>
            )}

            {/* Actions */}
            {draft.status === 'pending' && !isEditing && (
              <div className="flex gap-2 pt-2 border-t border-card-foreground/10">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1 text-card-foreground/60 hover:text-card-foreground hover:bg-card-foreground/10"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
                {onSchedule && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="flex-1 text-card-foreground/60 hover:text-card-foreground hover:bg-card-foreground/10"
                    onClick={() => setShowScheduleDialog(true)}
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Schedule
                  </Button>
                )}
                <Button 
                  size="sm" 
                  className={`flex-1 ${config.iconBg} ${config.textClass} border ${config.borderClass} hover:opacity-90`}
                  onClick={() => onApprove(draft.id)}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <>
                      <div className="h-3.5 w-3.5 mr-1.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            )}

            {draft.status === 'published' && draft.published_at && (
              <div className="text-xs text-card-foreground/50 pt-2 border-t border-card-foreground/10">
                Published {new Date(draft.published_at).toLocaleDateString()} at {new Date(draft.published_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-card border-card-foreground/20">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Delete Draft?</DialogTitle>
            <DialogDescription className="text-card-foreground/60">
              This will permanently delete this {config.label} draft. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="text-card-foreground/70">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                onDelete(draft.id);
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      {onSchedule && (
        <SchedulePostDialog
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          onSchedule={(scheduledFor, timezone) => {
            onSchedule(draft, scheduledFor, timezone);
            setShowScheduleDialog(false);
          }}
          platforms={[draft.platform]}
        />
      )}
    </>
  );
}
