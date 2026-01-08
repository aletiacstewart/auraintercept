import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, ExternalLink, Mic, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlatformInstallGuide } from './PlatformInstallGuide';

export const WidgetPreview = () => {
  const { companyId } = useAuth();
  const { toast } = useToast();
  const [companySlug, setCompanySlug] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const [previewMessages, setPreviewMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hi! How can we help you today?' }
  ]);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;
      const { data } = await supabase
        .from('companies')
        .select('slug')
        .eq('id', companyId)
        .single();
      if (data) setCompanySlug(data.slug);
    };
    fetchCompany();
  }, [companyId]);

  return (
    <div className="space-y-6">
      {/* Platform Installation Guide - Comprehensive embed code generators */}
      {companySlug && <PlatformInstallGuide companySlug={companySlug} />}

      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            Test your widget before adding it to your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg h-[500px] overflow-hidden border">
            {/* Mock website content */}
            <div className="p-8 space-y-4">
              <div className="h-8 bg-muted rounded w-48" />
              <div className="h-4 bg-muted/60 rounded w-full max-w-md" />
              <div className="h-4 bg-muted/60 rounded w-full max-w-sm" />
              <div className="h-32 bg-muted/40 rounded w-full max-w-lg mt-8" />
            </div>

            {/* Widget preview */}
            {isPreviewOpen && (
              <div className="absolute bottom-20 right-6 w-80 h-96 bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden border animate-in slide-in-from-bottom-4">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold flex-1">Your Company</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsPreviewOpen(false)}
                  >
                    ×
                  </Button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {previewMessages.map((msg, idx) => (
                    <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <span className={`inline-block px-3 py-2 rounded-lg max-w-[85%] ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-foreground'
                      }`}>
                        {msg.content}
                      </span>
                    </div>
                  ))}
                </div>
                <form 
                  className="p-4 border-t flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!previewMessage.trim()) return;
                    setPreviewMessages(prev => [...prev, { role: 'user', content: previewMessage }]);
                    setPreviewMessage('');
                    // Simulate AI response
                    setTimeout(() => {
                      setPreviewMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: 'This is a preview. Deploy the widget to your website for full AI functionality!' 
                      }]);
                    }, 500);
                  }}
                >
                  <Input 
                    placeholder="Type a message..." 
                    className="flex-1" 
                    value={previewMessage}
                    onChange={(e) => setPreviewMessage(e.target.value)}
                  />
                  <Button size="icon" type="submit">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}

            {/* Widget button */}
            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
