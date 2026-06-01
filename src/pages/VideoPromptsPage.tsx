import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Video, Info, Clapperboard, Film, Mic, ImageIcon, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sections, type Clip } from '@/lib/videoPromptsData';
import VideoPromptsPDF from '@/components/documentation/VideoPromptsPDF';
function ClipCard({ clip, sectionColor, sectionBorderColor }: { clip: Clip; sectionColor: string; sectionBorderColor: string }) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyTab = (type: 'video' | 'audio' | 'graphic') => {
    const text = type === 'video' ? clip.prompt : type === 'audio' ? clip.audioScript : clip.imagePrompt;
    navigator.clipboard.writeText(text);
    setCopiedTab(type);
    toast.success(`Clip ${clip.num} ${type} prompt copied!`);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleCopyAll = () => {
    const text = `=== CLIP ${clip.num}: ${clip.name} (8s) ===\nVIDEO: ${clip.prompt}\n\nAUDIO: ${clip.audioScript}\n\nGRAPHIC: ${clip.imagePrompt}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success(`All assets for Clip ${clip.num} copied!`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <Card className={`border ${sectionBorderColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className={`shrink-0 font-mono text-xs ${sectionColor} border-current/40`}>
              #{clip.num}
            </Badge>
            <CardTitle className="text-sm font-semibold truncate">{clip.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs">8s</Badge>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={handleCopyAll} title="Copy all assets">
              {copiedAll ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="video">
          <TabsList className="w-full mb-2">
            <TabsTrigger value="video" className="flex-1 gap-1 text-xs">
              <Film className="h-3 w-3" />
              Video
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex-1 gap-1 text-xs">
              <Mic className="h-3 w-3" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="graphic" className="flex-1 gap-1 text-xs">
              <ImageIcon className="h-3 w-3" />
              Graphic
            </TabsTrigger>
          </TabsList>
          <TabsContent value="video" className="mt-0">
            <div className="relative">
              <p className="text-xs text-foreground leading-relaxed pr-8">{clip.prompt}</p>
              <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleCopyTab('video')}>
                {copiedTab === 'video' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="audio" className="mt-0">
            <div className="relative">
              <p className="text-xs text-foreground leading-relaxed pr-8 italic">{clip.audioScript}</p>
              <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleCopyTab('audio')}>
                {copiedTab === 'audio' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="graphic" className="mt-0">
            <div className="relative">
              <p className="text-xs text-foreground leading-relaxed pr-8">{clip.imagePrompt}</p>
              <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleCopyTab('graphic')}>
                {copiedTab === 'graphic' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function VideoPromptsPage() {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    const allText = sections.flatMap(s =>
      s.clips.map(c =>
        `=== CLIP ${c.num}: ${c.name} (8s) ===\nVIDEO: ${c.prompt}\n\nAUDIO: ${c.audioScript}\n\nGRAPHIC: ${c.imagePrompt}`
      )
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    toast.success('All 34 prompts (Video + Audio + Graphic) copied to clipboard!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={Clapperboard}
          title="Promo Video Prompts"
          description="34 AI video generation prompts for Runway, Sora, Kling, and similar tools. Each clip includes a video prompt, 8-second audio script, and graphic image prompt."
        />

        <div className="space-y-6 pb-8">
          {/* Assembly Guide */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm text-foreground">Assembly Guide</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={handleCopyAll} className="h-7 text-xs border-border/50 text-foreground hover:bg-white/10">
                  {copiedAll ? <Check className="mr-1 h-3 w-3 text-green-400" /> : <Copy className="mr-1 h-3 w-3" />}
                  Copy All 34 Prompts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold">34</p>
                  <p className="text-xs text-muted-foreground">Total Clips</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold">4:32</p>
                  <p className="text-xs text-muted-foreground">Total Runtime</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold">0.5s</p>
                  <p className="text-xs text-muted-foreground">Dissolve (within console)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold">1s</p>
                  <p className="text-xs text-muted-foreground">Glitch (between consoles)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                {[
                  { label: 'Customer Portal', color: 'bg-blue-500/20 text-cyan-300 border border-blue-500/30' },
                  { label: 'Field Operations', color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
                  { label: 'Business Ops', color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
                  { label: 'Outreach & Sales', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
                  { label: 'Social Media', color: 'bg-pink-500/20 text-pink-300 border border-pink-500/30' },
                  { label: 'Creative & Web', color: 'bg-violet-500/20 text-violet-300 border border-violet-500/30' },
                  { label: 'Analytics & Reports', color: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
                  { label: 'AI Operatives Hub', color: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
                ].map(item => (
                  <span key={item.label} className={`px-2 py-1 rounded-full font-medium ${item.color}`}>{item.label}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-foreground/85 border-t border-border/50 pt-3">
                <span className="flex items-center gap-1"><Film className="h-3 w-3" /> Video — AI video generation prompt</span>
                <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Audio — 8-second voiceover script</span>
                <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Graphic — Still image generation prompt</span>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {sections.map(section => (
            <div key={section.title}>
              <div className={`flex items-center gap-2 mb-3 px-1`}>
                <Video className={`h-4 w-4 ${section.color}`} />
                <h2 className={`text-sm font-semibold ${section.color}`}>{section.title}</h2>
                <Badge variant="outline" className="text-xs">{section.clips.length} clip{section.clips.length !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {section.clips.map(clip => (
                  <ClipCard
                    key={clip.num}
                    clip={clip}
                    sectionColor={section.color}
                    sectionBorderColor={section.borderColor}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
