import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle2 } from 'lucide-react';

interface BlogTopicInputProps {
  topic: string;
  keywords: string;
  tone: string;
  wordCount: string;
  hasTavily: boolean;
  onTopicChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onWordCountChange: (value: string) => void;
}

export function BlogTopicInput({
  topic,
  keywords,
  tone,
  wordCount,
  hasTavily,
  onTopicChange,
  onKeywordsChange,
  onToneChange,
  onWordCountChange,
}: BlogTopicInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic">What would you like to write about? *</Label>
        <Textarea
          id="topic"
          placeholder="e.g., 10 Tips for Maintaining Your HVAC System in Summer"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Target Keywords (optional)</Label>
        <Input
          id="keywords"
          placeholder="e.g., HVAC maintenance, energy efficiency, home comfort"
          value={keywords}
          onChange={(e) => onKeywordsChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Separate keywords with commas. These will be naturally incorporated into the content.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tone</Label>
          <Select value={tone} onValueChange={onToneChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual & Friendly</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="conversational">Conversational</SelectItem>
              <SelectItem value="authoritative">Authoritative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Target Word Count</Label>
          <Select value={wordCount} onValueChange={onWordCountChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500">~500 words (Quick read)</SelectItem>
              <SelectItem value="1000">~1000 words (Standard)</SelectItem>
              <SelectItem value="1500">~1500 words (In-depth)</SelectItem>
              <SelectItem value="2000">~2000 words (Comprehensive)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasTavily && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Tavily AI Research Connected</p>
            <p className="text-xs text-muted-foreground">
              Will research current trends before generating content
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Search className="h-3 w-3" />
            Enhanced
          </Badge>
        </div>
      )}
    </div>
  );
}
