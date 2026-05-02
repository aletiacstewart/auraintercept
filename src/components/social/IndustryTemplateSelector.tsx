import { useState } from 'react';
import { ChevronDown, Check, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { INDUSTRY_LIST, type IndustryTemplate } from '@/lib/industryTemplates';
import { cn } from '@/lib/utils';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { useAuth } from '@/contexts/AuthContext';

interface IndustryTemplateSelectorProps {
  onSelectTemplate?: (template: string, platform: string) => void;
  className?: string;
}

export function IndustryTemplateSelector({ onSelectTemplate, className }: IndustryTemplateSelectorProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('instagram');
  const { pack } = useIndustryPack();
  const { userRole } = useAuth();
  const isPlatformAdmin = userRole === 'platform_admin';

  // For tenant users, lock the template list to the company's industry only.
  // Platform admins keep the full list to preview every vertical.
  const companyIndustry = INDUSTRY_LIST.find(i => i.id === pack?.industry_id) ?? null;
  const visibleIndustries = isPlatformAdmin
    ? INDUSTRY_LIST
    : (companyIndustry ? [companyIndustry] : []);
  const lockedToSingle = !isPlatformAdmin && visibleIndustries.length === 1;

  const handleIndustrySelect = (industry: IndustryTemplate) => {
    setSelectedIndustry(industry);
    setDialogOpen(true);
  };

  const handleCopyTemplate = (template: string, platform: string) => {
    navigator.clipboard.writeText(template);
    toast.success('Template copied to clipboard!');
    if (onSelectTemplate) {
      onSelectTemplate(template, platform);
    }
  };

  const handleUseTemplate = (template: string, platform: string) => {
    if (onSelectTemplate) {
      onSelectTemplate(template, platform);
      setDialogOpen(false);
      toast.success('Template loaded! Edit as needed.');
    } else {
      handleCopyTemplate(template, platform);
    }
  };

  const platformLabels: Record<string, { label: string; emoji: string }> = {
    instagram: { label: 'Instagram', emoji: '📸' },
    facebook: { label: 'Facebook', emoji: '👥' },
    linkedin: { label: 'LinkedIn', emoji: '💼' },
    tiktok: { label: 'TikTok', emoji: '🎵' },
    sms: { label: 'SMS', emoji: '📱' },
  };

  return (
    <>
      {visibleIndustries.length === 0 ? (
        <Button variant="outline" size="sm" className={cn('gap-2', className)} disabled>
          <Sparkles className="h-3.5 w-3.5" />
          No templates for your industry yet
        </Button>
      ) : lockedToSingle ? (
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2', className)}
          onClick={() => handleIndustrySelect(visibleIndustries[0])}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{visibleIndustries[0].icon}</span>
          {visibleIndustries[0].label} Templates
        </Button>
      ) : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn('gap-2', className)}>
            <Sparkles className="h-3.5 w-3.5" />
            Industry Templates
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-[400px] overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Select your industry for pre-written templates
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleIndustries.map((industry) => (
            <DropdownMenuItem
              key={industry.id}
              onClick={() => handleIndustrySelect(industry)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-lg">{industry.icon}</span>
              <span className="flex-1">{industry.label}</span>
              <Badge variant="secondary" className="text-[10px]">
                {Object.values(industry.templates).flat().length}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedIndustry?.icon}</span>
              {selectedIndustry?.label} Templates
            </DialogTitle>
            <DialogDescription>
              Pre-written templates for your industry. Click to copy or use directly.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full grid grid-cols-5">
              {Object.entries(platformLabels).map(([key, { label, emoji }]) => (
                <TabsTrigger key={key} value={key} className="text-xs gap-1">
                  <span>{emoji}</span>
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              {Object.entries(platformLabels).map(([platform, { label }]) => (
                <TabsContent key={platform} value={platform} className="mt-0 space-y-3">
                  {selectedIndustry?.templates[platform as keyof IndustryTemplate['templates']]?.map((template, idx) => (
                    <Card
                      key={idx}
                      className="p-3 hover:bg-accent/50 transition-colors group cursor-pointer"
                      onClick={() => handleUseTemplate(template, platform)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm whitespace-pre-wrap">{template}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyTemplate(template, platform);
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="default"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseTemplate(template, platform);
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {(!selectedIndustry?.templates[platform as keyof IndustryTemplate['templates']] || 
                    selectedIndustry.templates[platform as keyof IndustryTemplate['templates']].length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No templates available for {label}</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
