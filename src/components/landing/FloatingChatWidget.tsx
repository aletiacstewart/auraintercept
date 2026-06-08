import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, X, AlertTriangle } from 'lucide-react';
import { ReportIssueDialog } from '@/components/error/ReportIssueDialog';
import { Button } from '@/components/ui/button';
import { LandingAIChat } from './LandingAIChat';
import { UnifiedCustomerConsole } from '@/components/customer/UnifiedCustomerConsole';
import { AuraAvatarChat } from '@/components/aura/AuraAvatarChat';
import { supabase } from '@/integrations/supabase/client';

interface FloatingChatWidgetProps {
  /** Website ID for tracking (Smart Website context) */
  websiteId?: string;
  /** Company ID for context */
  companyId?: string;
  /** Company slug for console */
  companySlug?: string;
  /** Company name for display */
  companyName?: string;
  /** Visitor fingerprint for tracking */
  visitorFingerprint?: string;
  /** Primary color for styling */
  primaryColor?: string;
  /** Use full multi-agent system instead of basic landing chat */
  useMultiAgent?: boolean;
}

export const FloatingChatWidget = React.forwardRef<HTMLDivElement, FloatingChatWidgetProps>(
  (
    {
      websiteId,
      companyId,
      companySlug,
      companyName,
      visitorFingerprint,
      primaryColor,
      useMultiAgent = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasTrackedOpen, setHasTrackedOpen] = useState(false);

    // Track chat widget open
    const trackChatOpen = useCallback(async () => {
      if (!websiteId || hasTrackedOpen) return;
      
      // Increment chat_interactions metric
      await supabase.rpc('increment_site_metric', {
        p_website_id: websiteId,
        p_metric: 'chat_interactions',
      });
      
      // Log chat opened event
      if (visitorFingerprint) {
        await supabase.from('site_chat_logs').insert({
          website_id: websiteId,
          visitor_fingerprint: visitorFingerprint,
          interaction_type: 'chat_opened',
        });
      }
      
      setHasTrackedOpen(true);
    }, [websiteId, visitorFingerprint, hasTrackedOpen]);

    const handleOpen = useCallback(() => {
      setIsOpen(true);
      trackChatOpen();
    }, [trackChatOpen]);

    // Reset tracking when widget closes (for next session)
    useEffect(() => {
      if (!isOpen) {
        // Delay reset so returning visitors in same session aren't tracked twice
        const timer = setTimeout(() => setHasTrackedOpen(false), 60000);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    const buttonStyle = primaryColor 
      ? { background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }
      : { background: 'linear-gradient(135deg, #00E5FF, #46a2d3)' };

    return (
      <div ref={ref}>
        {/* Chat Panel */}
        {isOpen && (
          <div className="fixed bottom-24 right-6 z-50 w-[400px] h-[720px] max-h-[85vh] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="w-full h-full bg-card/95 backdrop-blur-lg border border-primary/30 shadow-2xl rounded-xl overflow-hidden flex flex-col">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full hover:bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {useMultiAgent && (companyId || companySlug) ? (
                <UnifiedCustomerConsole 
                  companyId={companyId}
                  companySlug={companySlug}
                  isEmbedded={true}
                />
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                  <div className="p-3 border-b border-border/40">
                    <AuraAvatarChat variant="inline" />
                  </div>
                  <div className="p-4 flex-1 min-h-0 flex flex-col">
                    <LandingAIChat
                      websiteId={websiteId}
                      companyId={companyId}
                      visitorFingerprint={visitorFingerprint}
                    />
                  </div>
                </div>
              )}
              
              {/* Report Issue Footer */}
              <div className="px-3 py-2 border-t border-border/30 bg-muted/30">
                <ReportIssueDialog
                  trigger={
                    <button className="text-xs text-white hover:text-primary flex items-center gap-1.5 transition-colors">
                      <AlertTriangle className="w-3 h-3" />
                      Report Issue
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <Button
          onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
          className={`fixed bottom-6 right-6 z-[9999] h-11 w-11 rounded-full shadow-lg hover:opacity-90 transition-all duration-300 ${
            isOpen ? 'rotate-0' : 'animate-pulse'
          }`}
          style={buttonStyle}
          size="icon"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Sparkles className="w-5 h-5 text-white" />
          )}
        </Button>
      </div>
    );
  }
);

FloatingChatWidget.displayName = 'FloatingChatWidget';
