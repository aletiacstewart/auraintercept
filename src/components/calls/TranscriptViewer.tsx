import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Search, 
  Copy, 
  Download, 
  Bot, 
  User,
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptMessage {
  role: string;
  content: string;
  timestamp?: string;
}

interface TranscriptViewerProps {
  transcript: TranscriptMessage[];
  customerName?: string;
}

export function TranscriptViewer({ transcript, customerName = 'Customer' }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredTranscript = searchQuery
    ? transcript.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transcript;

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  const copyTranscript = () => {
    const text = transcript
      .map(msg => `${msg.role === 'user' ? customerName : 'AI Agent'}: ${msg.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Transcript copied to clipboard',
    });
  };

  const downloadTranscript = () => {
    const text = transcript
      .map(msg => `[${msg.role === 'user' ? customerName : 'AI Agent'}]\n${msg.content}`)
      .join('\n\n---\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded',
      description: 'Transcript downloaded successfully',
    });
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded',
      description: 'Transcript JSON downloaded successfully',
    });
  };

  if (!transcript || transcript.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Transcript
          <span className="text-xs text-muted-foreground font-normal">
            ({transcript.length} messages)
          </span>
        </h4>
        
        <div className="flex items-center gap-1">
          {showSearch ? (
            <div className="flex items-center gap-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-8 w-40"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={copyTranscript}
            title="Copy transcript"
          >
            <Copy className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={downloadTranscript}
            title="Download as TXT"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search results indicator */}
      {searchQuery && (
        <p className="text-xs text-muted-foreground">
          {filteredTranscript.length} of {transcript.length} messages match
        </p>
      )}

      {/* Transcript Messages */}
      <ScrollArea className="h-80 rounded-lg border bg-muted/30 p-4">
        <div className="space-y-4">
          {filteredTranscript.map((msg, i) => {
            const isUser = msg.role === 'user';
            
            return (
              <div 
                key={i} 
                className={cn(
                  'flex gap-3',
                  isUser ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback 
                    className={cn(
                      "text-xs",
                      isUser 
                        ? "bg-secondary/20 text-secondary" 
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                
                <div 
                  className={cn(
                    'flex-1 max-w-[80%] space-y-1',
                    isUser ? 'text-right' : 'text-left'
                  )}
                >
                  <div className="flex items-center gap-2" style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <span className="text-xs font-medium text-muted-foreground">
                      {isUser ? customerName : 'AI Agent'}
                    </span>
                    {msg.timestamp && (
                      <span className="text-xs text-muted-foreground/60">
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                  
                  <div 
                    className={cn(
                      'inline-block p-3 rounded-xl text-sm',
                      isUser 
                        ? 'bg-secondary text-secondary-foreground rounded-tr-sm' 
                        : 'bg-card border rounded-tl-sm'
                    )}
                  >
                    {highlightText(msg.content, searchQuery)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Download Options */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Export as:</span>
        <Button 
          variant="link" 
          size="sm" 
          className="h-auto p-0 text-xs"
          onClick={downloadTranscript}
        >
          TXT
        </Button>
        <span>·</span>
        <Button 
          variant="link" 
          size="sm" 
          className="h-auto p-0 text-xs"
          onClick={downloadJSON}
        >
          JSON
        </Button>
      </div>
    </div>
  );
}
