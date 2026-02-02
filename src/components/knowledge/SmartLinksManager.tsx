import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Copy, 
  GripVertical, 
  Calendar, 
  DollarSign, 
  Star, 
  Receipt, 
  AlertTriangle, 
  Link2,
  ExternalLink,
  Check,
  X
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SmartLink {
  id: string;
  company_id: string;
  category: SmartLinkCategory;
  name: string;
  description: string | null;
  url: string;
  intent_triggers: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

type SmartLinkCategory = 'scheduling' | 'pricing' | 'reviews' | 'invoicing' | 'emergency' | 'custom';

const CATEGORY_CONFIG: Record<SmartLinkCategory, { label: string; icon: React.ReactNode; color: string; defaultTriggers: string[] }> = {
  scheduling: {
    label: 'Scheduling',
    icon: <Calendar className="w-4 h-4" />,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    defaultTriggers: ['book', 'schedule', 'appointment', 'availability', 'when can'],
  },
  pricing: {
    label: 'Pricing',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    defaultTriggers: ['how much', 'price', 'cost', 'quote', 'estimate', 'rate'],
  },
  reviews: {
    label: 'Reviews',
    icon: <Star className="w-4 h-4" />,
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    defaultTriggers: ['reviews', 'ratings', 'reputation', 'good', 'recommend'],
  },
  invoicing: {
    label: 'Invoicing',
    icon: <Receipt className="w-4 h-4" />,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    defaultTriggers: ['pay', 'invoice', 'bill', 'payment', 'balance'],
  },
  emergency: {
    label: 'Emergency',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    defaultTriggers: ['emergency', 'urgent', 'after hours', '24/7'],
  },
  custom: {
    label: 'Custom',
    icon: <Link2 className="w-4 h-4" />,
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    defaultTriggers: [],
  },
};

interface SortableRowProps {
  link: SmartLink;
  onEdit: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
}

function SortableRow({ link, onEdit, onDelete, onCopyUrl }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const categoryConfig = CATEGORY_CONFIG[link.category];

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted' : ''}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`${categoryConfig.color} flex items-center gap-1.5 w-fit`}>
          {categoryConfig.icon}
          {categoryConfig.label}
        </Badge>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{link.name}</p>
          {link.description && (
            <p className="text-sm text-muted-foreground truncate max-w-xs">
              {link.description}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        {link.url ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {link.url}
            </span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCopyUrl} title="Copy URL">
              <Copy className="w-3 h-3" />
            </Button>
            {link.url && (
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Open URL">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm italic">Not configured</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {link.intent_triggers.slice(0, 3).map((trigger, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {trigger}
            </Badge>
          ))}
          {link.intent_triggers.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{link.intent_triggers.length - 3}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={link.is_active ? 'default' : 'secondary'}>
          {link.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} title="Edit">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SmartLinksManager() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SmartLink | null>(null);
  const [triggerInput, setTriggerInput] = useState('');
  const [formData, setFormData] = useState({
    category: 'custom' as SmartLinkCategory,
    name: '',
    description: '',
    url: '',
    intent_triggers: [] as string[],
    is_active: true,
  });

  const { data: smartLinks, isLoading } = useQuery({
    queryKey: ['smart-links', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('smart_links')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as SmartLink[];
    },
    enabled: !!companyId,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const reorderMutation = useMutation({
    mutationFn: async (reorderedLinks: { id: string; sort_order: number }[]) => {
      const updates = reorderedLinks.map(({ id, sort_order }) =>
        supabase.from('smart_links').update({ sort_order }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onError: (error) => {
      console.error('Error reordering smart links:', error);
      toast.error('Failed to save order');
      queryClient.invalidateQueries({ queryKey: ['smart-links'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !smartLinks) return;

    const oldIndex = smartLinks.findIndex((l) => l.id === active.id);
    const newIndex = smartLinks.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(smartLinks, oldIndex, newIndex);
    queryClient.setQueryData(['smart-links', companyId], reordered);
    
    const updates = reordered.map((link, index) => ({
      id: link.id,
      sort_order: index,
    }));
    reorderMutation.mutate(updates);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId) throw new Error('No company ID');
      
      const payload = {
        company_id: companyId,
        category: data.category,
        name: data.name,
        description: data.description || null,
        url: data.url,
        intent_triggers: data.intent_triggers,
        is_active: data.is_active,
      };

      if (editingLink) {
        const { error } = await supabase
          .from('smart_links')
          .update(payload)
          .eq('id', editingLink.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('smart_links')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-links'] });
      toast.success(editingLink ? 'Smart link updated!' : 'Smart link created!');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving smart link:', error);
      toast.error('Failed to save smart link');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('smart_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-links'] });
      toast.success('Smart link deleted');
    },
    onError: (error) => {
      console.error('Error deleting smart link:', error);
      toast.error('Failed to delete smart link');
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLink(null);
    setTriggerInput('');
    setFormData({
      category: 'custom',
      name: '',
      description: '',
      url: '',
      intent_triggers: [],
      is_active: true,
    });
  };

  const handleOpenCreate = () => {
    setEditingLink(null);
    setFormData({
      category: 'custom',
      name: '',
      description: '',
      url: '',
      intent_triggers: [],
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (link: SmartLink) => {
    setEditingLink(link);
    setFormData({
      category: link.category,
      name: link.name,
      description: link.description || '',
      url: link.url,
      intent_triggers: link.intent_triggers || [],
      is_active: link.is_active,
    });
    setDialogOpen(true);
  };

  const handleCategoryChange = (category: SmartLinkCategory) => {
    const config = CATEGORY_CONFIG[category];
    setFormData(prev => ({
      ...prev,
      category,
      intent_triggers: prev.intent_triggers.length === 0 ? config.defaultTriggers : prev.intent_triggers,
    }));
  };

  const handleAddTrigger = () => {
    const trigger = triggerInput.trim().toLowerCase();
    if (trigger && !formData.intent_triggers.includes(trigger)) {
      setFormData(prev => ({
        ...prev,
        intent_triggers: [...prev.intent_triggers, trigger],
      }));
    }
    setTriggerInput('');
  };

  const handleRemoveTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      intent_triggers: prev.intent_triggers.filter(t => t !== trigger),
    }));
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Smart Links
          </CardTitle>
          <CardDescription>
            Configure URLs that Aura can share with customers based on detected intent
          </CardDescription>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Smart Link
        </Button>
      </CardHeader>
      <CardContent>
        {smartLinks && smartLinks.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={smartLinks.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Intent Triggers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smartLinks.map(link => (
                    <SortableRow
                      key={link.id}
                      link={link}
                      onEdit={() => handleOpenEdit(link)}
                      onDelete={() => deleteMutation.mutate(link.id)}
                      onCopyUrl={() => handleCopyUrl(link.url)}
                    />
                  ))}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No smart links configured yet.</p>
            <p className="text-sm mt-1">Add URLs that Aura can share when customers ask about booking, pricing, reviews, etc.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? 'Edit Smart Link' : 'Add Smart Link'}
            </DialogTitle>
            <DialogDescription>
              Configure a URL that Aura can share based on customer intent
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleCategoryChange(value as SmartLinkCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Online Booking Portal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this link is for..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Intent Triggers</Label>
              <p className="text-sm text-muted-foreground">
                Keywords that trigger Aura to share this link
              </p>
              <div className="flex gap-2">
                <Input
                  value={triggerInput}
                  onChange={(e) => setTriggerInput(e.target.value)}
                  placeholder="Add trigger keyword..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTrigger();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddTrigger}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.intent_triggers.map((trigger, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {trigger}
                    <button
                      type="button"
                      onClick={() => handleRemoveTrigger(trigger)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Only active links will be shared by Aura
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editingLink ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
