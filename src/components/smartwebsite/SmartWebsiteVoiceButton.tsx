import React, { useState, useCallback, useRef } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { VoiceChat } from '@/components/ai/VoiceChat';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SmartWebsiteVoiceButtonProps {
  websiteId: string;
  companyId: string;
  companyName: string;
  visitorFingerprint: string;
  primaryColor?: string;
}

export function SmartWebsiteVoiceButton({
  websiteId,
  companyId,
  companyName,
  visitorFingerprint,
  primaryColor = '#00E5FF',
}: SmartWebsiteVoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const sessionStartRef = useRef<number | null>(null);

  const trackVoiceStart = useCallback(async () => {
    sessionStartRef.current = Date.now();
    
    // Increment voice_interactions metric
    await supabase.rpc('increment_site_metric', {
      p_website_id: websiteId,
      p_metric: 'voice_interactions',
    });
    
    // Log voice started event
    await supabase.functions.invoke('log-site-event', {
      body: {
        website_id: websiteId,
        visitor_fingerprint: visitorFingerprint,
        interaction_type: 'voice_started',
      },
    });
  }, [websiteId, visitorFingerprint]);

  const trackVoiceEnd = useCallback(async () => {
    const duration = sessionStartRef.current 
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
      : 0;
    
    // Log voice ended event with duration
    await supabase.functions.invoke('log-site-event', {
      body: {
        website_id: websiteId,
        visitor_fingerprint: visitorFingerprint,
        interaction_type: 'voice_ended',
        duration_seconds: duration,
      },
    });
    
    sessionStartRef.current = null;
  }, [websiteId, visitorFingerprint]);

  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setTranscript([]);
    await trackVoiceStart();
  }, [trackVoiceStart]);

  const handleClose = useCallback(async () => {
    if (sessionStartRef.current) {
      await trackVoiceEnd();
    }
    setIsOpen(false);
    setTranscript([]);
  }, [trackVoiceEnd]);

  const handleTranscript = useCallback((role: 'user' | 'assistant', text: string) => {
    setTranscript(prev => [...prev, { role, text }]);
  }, []);

  return (
    <>
      {/* Voice Button - positioned above chat button */}
      <Button
        onClick={handleOpen}
        className="fixed bottom-24 right-6 z-[9998] h-12 w-12 rounded-full shadow-xl hover:opacity-90 transition-all duration-300"
        style={{ backgroundColor: primaryColor }}
        size="icon"
      >
        <Mic className="w-5 h-5 text-white" />
      </Button>

      {/* Voice Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" style={{ color: primaryColor }} />
              Talk to Aura - {companyName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <VoiceChat
              companyId={companyId}
              companyName={companyName}
              onTranscript={handleTranscript}
              testMode={false}
            />
            
            {/* Transcript Display */}
            {transcript.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Transcript</p>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {transcript.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`text-sm p-2 rounded ${
                          msg.role === 'user' 
                            ? 'bg-muted ml-4' 
                            : 'bg-primary/10 mr-4'
                        }`}
                      >
                        <span className="font-medium">
                          {msg.role === 'user' ? 'You: ' : 'AI: '}
                        </span>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
