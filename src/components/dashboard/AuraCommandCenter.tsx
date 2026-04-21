import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  { key: 'bookEmergency', icon: CalendarPlus },
  { key: 'overdueInvoices', icon: FileText },
  { key: 'generatePosts', icon: PenTool },
  { key: 'checkDispatch', icon: Truck },
  { key: 'createQuote', icon: UserPlus },
  { key: 'weekRevenue', icon: DollarSign },
] as const;

export function AuraCommandCenter() {
  const { companyId, user } = useAuth();
  const { isListening, toggleVoiceMode } = useVoice();
  const aura = useUnifiedAura({ companyId: companyId ?? undefined, userId: user?.id });
  const [input, setInput] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation('aura');

  // Auto-populate first command after Fast Start onboarding
  useEffect(() => {
    if (searchParams.get('firstCommand') === 'true') {
      setInput('Show me what you can do');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
              {t('command.heading')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={t('command.placeholder')}
              className="flex-1 h-12 text-base bg-muted border-border focus-visible:ring-primary"
              disabled={aura.isProcessing}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-12 w-12 shrink-0 text-muted-foreground hover:text-primary"
              onClick={toggleVoiceMode}
              aria-label={isListening ? t('command.voiceStop') : t('command.voiceStart')}
            >
              {isListening ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              size="icon"
              className="h-12 w-12 shrink-0"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || aura.isProcessing}
              aria-label={t('command.send')}
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
            key={cmd.key}
            className="bg-card border-border hover:border-primary cursor-pointer transition-colors group"
            onClick={() => handleCardClick(t(`suggestions.${cmd.key}`))}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <cmd.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-card-foreground leading-tight">
                {t(`suggestions.${cmd.key}`)}
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
