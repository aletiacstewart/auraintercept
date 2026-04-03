import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedAura } from '@/hooks/useUnifiedAura';
import { useVoice } from '@/contexts/VoiceContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuraLiveStream } from '@/components/aura/AuraLiveStream';
import {
  Mic,
  MicOff,
  Send,
  CalendarPlus,
  FileText,
  PenTool,
  Truck,
  UserPlus,
  DollarSign,
  Sparkles,
} from 'lucide-react';

const SUGGESTED_COMMANDS = [
  { label: "Book today's emergency job", icon: CalendarPlus },
  { label: 'Show overdue invoices & chase them', icon: FileText },
  { label: 'Generate social posts for spring tune-ups', icon: PenTool },
  { label: "Check today's dispatch schedule", icon: Truck },
  { label: 'Create a quote for a new lead', icon: UserPlus },
  { label: "Show me this week's revenue", icon: DollarSign },
];

export function AuraCommandCenter() {
  const { companyId, user } = useAuth();
  const { isListening, toggleVoiceMode } = useVoice();
  const aura = useUnifiedAura({ companyId: companyId ?? undefined, userId: user?.id });
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(
    (text?: string) => {
      const command = text ?? input;
      if (!command.trim()) return;
      aura.handleInput(command);
      setInput('');
    },
    [input, aura],
  );

  const handleCardClick = useCallback(
    (label: string) => {
      setInput(label);
      handleSubmit(label);
    },
    [handleSubmit],
  );

  return (
    <div className="space-y-6">
      {/* Hero Command Input */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              What do you want Aura to do today?
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Book a job, chase invoices, generate posts…"
              className="flex-1 h-12 text-base bg-muted border-border focus-visible:ring-primary"
              disabled={aura.isProcessing}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-12 w-12 shrink-0 text-muted-foreground hover:text-primary"
              onClick={toggleVoiceMode}
              aria-label={isListening ? 'Stop voice' : 'Start voice'}
            >
              {isListening ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              size="icon"
              className="h-12 w-12 shrink-0"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || aura.isProcessing}
              aria-label="Send command"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Command Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {SUGGESTED_COMMANDS.map((cmd) => (
          <Card
            key={cmd.label}
            className="bg-card border-border hover:border-primary cursor-pointer transition-colors group"
            onClick={() => handleCardClick(cmd.label)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <cmd.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-card-foreground leading-tight">
                {cmd.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aura Live Activity Feed */}
      {companyId && <AuraLiveStream companyId={companyId} />}
    </div>
  );
}
