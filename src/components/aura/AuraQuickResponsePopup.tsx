import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuraQuickResponsePopupProps {
  response: string;
  onDismiss: () => void;
}

export function AuraQuickResponsePopup({ response, onDismiss }: AuraQuickResponsePopupProps) {
  const navigate = useNavigate();
  
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Truncate long responses
  const truncatedResponse = response.length > 300 
    ? response.slice(0, 300) + '...' 
    : response;
  
  const handleViewFull = () => {
    navigate('/dashboard/analytics-reports');
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border rounded-xl shadow-lg z-50"
    >
      <div className="flex items-start gap-3">
        {/* Aura Icon */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        
        {/* Response Content */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="max-h-32">
            <p className="text-sm text-foreground whitespace-pre-wrap">{truncatedResponse}</p>
          </ScrollArea>
          
          {/* Actions */}
          {response.length > 300 && (
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
        
        {/* Close Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 flex-shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Progress bar for auto-dismiss */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 8, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-0.5 bg-primary/30 rounded-b-xl"
      />
    </motion.div>
  );
}
