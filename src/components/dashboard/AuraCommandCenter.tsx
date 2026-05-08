import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedAura } from '@/hooks/useUnifiedAura';
import { useVoice } from '@/contexts/VoiceContext';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getIndustryQuickActions } from '@/lib/industryQuickActions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuraLiveStream } from '@/components/aura/AuraLiveStream';
import { AuraAvatarChat } from '@/components/aura/AuraAvatarChat';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Video,
} from 'lucide-react';

export function AuraCommandCenter() {
  const { companyId, user } = useAuth();
  const { isListening, toggleVoiceMode } = useVoice();
  const aura = useUnifiedAura({ companyId: companyId ?? undefined, userId: user?.id });
  const [input, setInput] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation('aura');
  const { pack } = useIndustryPack();
  // Quick actions resolve from the company's industry pack so a real-estate
  // company sees showings/listings instead of HVAC emergency calls.
  const quickActions = getIndustryQuickActions(pack);
  const [voiceMode, setVoiceMode] = useState(false);

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
    (label: string, route: string) => {
      // Fire the prompt at Aura (so the live stream/log captures intent),
      // then immediately navigate to the destination screen.
      aura.handleInput(label);
      navigate(route);
    },
    [aura, navigate],
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
            <Button
              size="sm"
              variant={voiceMode ? 'default' : 'ghost'}
              className="ml-auto h-7 px-2 text-xs"
              onClick={() => setVoiceMode((v) => !v)}
              aria-pressed={voiceMode}
            >
              <Video className="h-3.5 w-3.5 mr-1" />
              {voiceMode ? 'Voice mode on' : 'Voice mode'}
            </Button>
          </div>

          {voiceMode && (
            <div className="pt-3">
              <AuraAvatarChat variant="inline" />
            </div>
          )}

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
              className="h-12 w-12 shrink-0 text-white hover:text-primary"
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

      {/* Suggested Command Cards — quick actions */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <h3 className="text-sm font-semibold text-foreground">
            {t('suggestions.sectionTitle')}
          </h3>
          <p className="text-xs text-white">
            {t('suggestions.sectionHint')}
          </p>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((cmd) => (
            <Card
              key={cmd.key}
              role="button"
              tabIndex={0}
              aria-label={cmd.label}
              className="bg-card border-border hover:border-primary cursor-pointer transition-colors group"
              onClick={() => handleCardClick(cmd.command ?? cmd.label, cmd.route)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(cmd.command ?? cmd.label, cmd.route);
                }
              }}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <cmd.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-card-foreground leading-tight">
                    {cmd.label}
                  </p>
                  <p className="text-xs text-white leading-snug">
                    {cmd.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Aura Live Activity Feed */}
      {companyId && <AuraLiveStream companyId={companyId} />}
    </div>
  );
}
