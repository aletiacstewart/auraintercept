import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ExternalLink, Pin, PinOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuraQuickResponsePopupProps {
  response: string;
  onDismiss: () => void;
}

export function AuraQuickResponsePopup({ response, onDismiss }: AuraQuickResponsePopupProps) {
  const navigate = useNavigate();
  const [isPinned, setIsPinned] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15); // 15 seconds default
  
  // Auto-dismiss after 15 seconds unless pinned
  useEffect(() => {
    if (isPinned) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [onDismiss, isPinned]);

  // Reset timer when response changes
  useEffect(() => {
    setTimeRemaining(15);
    setIsPinned(false);
  }, [response]);

  const togglePin = useCallback(() => {
    setIsPinned(prev => !prev);
    if (!isPinned) {
      setTimeRemaining(15); // Reset timer when unpinning
    }
  }, [isPinned]);

  // Format response for better display
  const formatResponse = (text: string) => {
    // Check if it's a simple number/count response
    if (/^\d+$/.test(text.trim())) {
      return text;
    }
    return text;
  };
  
  const handleViewFull = () => {
    navigate('/dashboard/ai-consoles/business-mgt-ops');
    onDismiss();
  };

  const shouldShowViewFull = response.length > 500;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border border-border rounded-xl shadow-lg z-50"
    >
      <div className="flex items-start gap-3">
        {/* Aura Icon */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        
        {/* Response Content */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="max-h-48">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {formatResponse(response)}
            </p>
          </ScrollArea>
          
          {/* Actions */}
          {shouldShowViewFull && (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2 text-primary"
              onClick={handleViewFull}
            >
              View full response
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Pin Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={togglePin}
            title={isPinned ? "Unpin response" : "Pin response"}
          >
            {isPinned ? (
              <PinOff className="h-3 w-3 text-primary" />
            ) : (
              <Pin className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
          
          {/* Close Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Progress bar for auto-dismiss (only when not pinned) */}
      {!isPinned && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${(timeRemaining / 15) * 100}%` }}
          transition={{ duration: 0.5, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-0.5 bg-primary/30 rounded-b-xl"
        />
      )}
      
      {/* Pinned indicator */}
      {isPinned && (
        <div className="absolute bottom-1 left-4 text-xs text-muted-foreground">
          📌 Pinned
        </div>
      )}
    </motion.div>
  );
}
