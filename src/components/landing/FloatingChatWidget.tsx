import React, { useState, useCallback, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LandingAIChat } from './LandingAIChat';
import { SmartWebsiteChat } from '@/components/smartwebsite/SmartWebsiteChat';
import { supabase } from '@/integrations/supabase/client';

interface FloatingChatWidgetProps {
  /** Website ID for tracking (Smart Website context) */
  websiteId?: string;
  /** Company ID for context */
  companyId?: string;
  /** Company name for display */
  companyName?: string;
  /** Visitor fingerprint for tracking */
  visitorFingerprint?: string;
  /** Primary color for styling */
  primaryColor?: string;
  /** Use full multi-agent system instead of basic landing chat */
  useMultiAgent?: boolean;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  websiteId,
  companyId,
  companyName,
  visitorFingerprint,
  primaryColor,
  useMultiAgent = false,
}) => {
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
    : { background: 'linear-gradient(135deg, #214ebb, #46a2d3)' };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <Card className="w-full h-full p-4 bg-card/95 backdrop-blur-lg border-primary/30 shadow-2xl flex flex-col">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-primary/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            
            {useMultiAgent && companyId ? (
              <SmartWebsiteChat 
                companyId={companyId}
                companyName={companyName}
                websiteId={websiteId}
                visitorFingerprint={visitorFingerprint}
                primaryColor={primaryColor}
              />
            ) : (
              <LandingAIChat 
                websiteId={websiteId}
                companyId={companyId}
                visitorFingerprint={visitorFingerprint}
              />
            )}
          </Card>
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        className={`fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full shadow-2xl hover:opacity-90 transition-all duration-300 ${
          isOpen ? 'rotate-0' : 'animate-pulse'
        }`}
        style={buttonStyle}
        size="icon"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </Button>
    </>
  );
};
