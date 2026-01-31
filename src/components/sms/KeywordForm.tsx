import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export interface KeywordFormData {
  id?: string;
  keyword: string;
  response_message: string;
  is_enabled: boolean;
}

interface KeywordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KeywordFormData | null;
  onSubmit: (data: KeywordFormData) => void;
  isLoading?: boolean;
}

export function KeywordForm({ open, onOpenChange, initialData, onSubmit, isLoading }: KeywordFormProps) {
  const [keyword, setKeyword] = useState(initialData?.keyword || '');
  const [responseMessage, setResponseMessage] = useState(initialData?.response_message || '');
  const [isEnabled, setIsEnabled] = useState(initialData?.is_enabled ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKeyword = keyword.replace(/^#/, '').toLowerCase().trim();
    onSubmit({
      id: initialData?.id,
      keyword: cleanKeyword,
      response_message: responseMessage.trim(),
      is_enabled: isEnabled,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setKeyword(initialData?.keyword || '');
      setResponseMessage(initialData?.response_message || '');
      setIsEnabled(initialData?.is_enabled ?? true);
    }
    onOpenChange(newOpen);
  };

  // Reset form when initialData changes
  useState(() => {
    setKeyword(initialData?.keyword || '');
    setResponseMessage(initialData?.response_message || '');
    setIsEnabled(initialData?.is_enabled ?? true);
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Keyword' : 'Add Keyword'}</DialogTitle>
          <DialogDescription>
            Configure an auto-response for when customers text a hashtag keyword
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">#</span>
              <Input
                id="keyword"
                placeholder="menu"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                className="pl-7"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Customers will text #{keyword || 'keyword'} to trigger this response
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response">Response Message</Label>
            <Textarea
              id="response"
              placeholder="Here's our menu: https://yoursite.com/menu"
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              {responseMessage.length}/320 characters (recommended for SMS)
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div>
              <Label htmlFor="enabled" className="cursor-pointer">Enabled</Label>
              <p className="text-xs text-muted-foreground">Auto-respond when customers text this keyword</p>
            </div>
            <Switch
              id="enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading || !keyword || !responseMessage}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Keyword'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
