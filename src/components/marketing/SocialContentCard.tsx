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
  Edit2,
  Trash2,
  Send,
  Check,
  Clock,
  Image as ImageIcon,
  Hash,
} from 'lucide-react';

export interface SocialContentDraft {
  id: string;
  company_id: string;
  job_assignment_id: string | null;
  image_url: string | null;
  platform: 'instagram' | 'google_business' | 'facebook' | 'sms';
  generated_content: string;
  edited_content: string | null;
  hashtags: string[] | null;
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
  isPublishing?: boolean;
}

const PLATFORM_CONFIG = {
  instagram: {
    icon: Instagram,
    label: 'Instagram',
    gradient: 'from-pink-500 via-purple-500 to-orange-400',
    bgClass: 'bg-gradient-to-br from-pink-500/20 to-purple-500/20',
    borderClass: 'border-pink-500/30',
    charLimit: 2200,
  },
  google_business: {
    icon: MapPin,
    label: 'Google Business',
    gradient: 'from-blue-500 to-green-500',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/30',
    charLimit: 1500,
  },
  facebook: {
    icon: Facebook,
    label: 'Facebook',
    gradient: 'from-blue-600 to-blue-400',
    bgClass: 'bg-blue-600/20',
    borderClass: 'border-blue-600/30',
    charLimit: 500,
  },
  sms: {
    icon: MessageSquare,
    label: 'SMS Template',
    gradient: 'from-green-500 to-emerald-400',
    bgClass: 'bg-green-500/20',
    borderClass: 'border-green-500/30',
    charLimit: 160,
  },
};

export function SocialContentCard({ 
  draft, 
  onEdit, 
  onDelete, 
  onApprove,
  isPublishing = false,
}: SocialContentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(draft.edited_content || draft.generated_content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Check className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30"><Send className="h-3 w-3 mr-1" /> Published</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className={`overflow-hidden border ${config.borderClass} ${config.bgClass} backdrop-blur-sm`}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md bg-gradient-to-br ${config.gradient}`}>
                <PlatformIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-sm text-slate-200">{config.label}</span>
            </div>
            {getStatusBadge()}
          </div>

          {/* Image Preview */}
          {draft.image_url && draft.platform !== 'sms' && (
            <div className="relative aspect-video bg-slate-900/50">
              <img 
                src={draft.image_url} 
                alt="Job completion" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            </div>
          )}

          {!draft.image_url && draft.platform !== 'sms' && (
            <div className="aspect-video bg-slate-900/50 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span className="text-xs">No image</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-3 space-y-3">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[120px] bg-slate-900/50 border-slate-700 text-slate-200 text-sm resize-none"
                  placeholder="Edit content..."
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={isOverLimit ? 'text-red-400' : 'text-slate-400'}>
                    {editContent.length} / {config.charLimit}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
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
                <p className="text-sm text-slate-300 line-clamp-4 whitespace-pre-wrap">
                  {content}
                </p>
                
                {/* Hashtags */}
                {draft.hashtags && draft.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {draft.hashtags.slice(0, 5).map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs bg-slate-800/50 border-slate-700 text-slate-400"
                      >
                        <Hash className="h-2.5 w-2.5 mr-0.5" />
                        {tag}
                      </Badge>
                    ))}
                    {draft.hashtags.length > 5 && (
                      <Badge variant="outline" className="text-xs bg-slate-800/50 border-slate-700 text-slate-400">
                        +{draft.hashtags.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className={isOverLimit ? 'text-red-400' : ''}>
                    {charCount} / {config.charLimit}
                  </span>
                </div>
              </>
            )}

            {/* Actions */}
            {draft.status === 'pending' && !isEditing && (
              <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1 text-slate-400 hover:text-slate-200"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
                <Button 
                  size="sm" 
                  className={`flex-1 bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`}
                  onClick={() => onApprove(draft.id)}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <>
                      <div className="h-3.5 w-3.5 mr-1.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Approve & Post
                    </>
                  )}
                </Button>
              </div>
            )}

            {draft.status === 'published' && draft.published_at && (
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                Published {new Date(draft.published_at).toLocaleDateString()} at {new Date(draft.published_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Delete Draft?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will permanently delete this {config.label} draft. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
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
    </>
  );
}
