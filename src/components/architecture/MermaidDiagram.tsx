import { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MermaidDiagramProps {
  chart: string;
  title: string;
  description?: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

export function MermaidDiagram({ chart, title, description }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const uniqueId = useId().replace(/:/g, '');

  useEffect(() => {
    const renderDiagram = async () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        try {
          // Create a clean ID with only alphanumeric characters and dashes
          const cleanId = `mermaid${uniqueId}`;
          const { svg } = await mermaid.render(cleanId, chart);
          containerRef.current.innerHTML = svg;
          setSvgContent(svg);
        } catch (error) {
          console.error('Mermaid render error:', error);
          containerRef.current.innerHTML = '<p class="text-destructive">Failed to render diagram</p>';
        }
      }
    };
    renderDiagram();
  }, [chart, uniqueId]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(chart);
    setCopied(true);
    toast.success('Mermaid code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s/g, '-').toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG downloaded');
  };

  const handleDownloadPNG = async () => {
    if (!svgContent) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Convert SVG to a data URL to avoid CORS issues
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const reader = new FileReader();
      
      reader.onload = () => {
        img.onload = () => {
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          ctx?.scale(2, 2);
          ctx?.drawImage(img, 0, 0);
          
          try {
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
            a.click();
            toast.success('PNG downloaded');
          } catch {
            toast.error('PNG download failed - try SVG instead');
          }
        };
        img.src = reader.result as string;
      };
      
      reader.readAsDataURL(svgBlob);
    } catch {
      toast.error('PNG download failed - try SVG instead');
    }
  };
    
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyCode}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-1 hidden sm:inline">Code</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadSVG}>
            <Download className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">SVG</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPNG}>
            <Download className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">PNG</span>
          </Button>
        </div>
      </div>
      <div 
        ref={containerRef} 
        className="overflow-x-auto bg-background/50 rounded-md p-4 min-h-[200px]"
      />
    </div>
  );
}
