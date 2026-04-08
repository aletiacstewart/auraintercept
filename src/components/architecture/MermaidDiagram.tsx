import { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

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
  themeVariables: {
    primaryColor: '#1e3a5f',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#38bdf8',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    background: '#0f172a',
    mainBkg: '#1e293b',
    nodeBorder: '#475569',
    clusterBkg: '#0f172a',
    clusterBorder: '#334155',
    titleColor: '#f8fafc',
    edgeLabelBackground: '#1e293b',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: false,
    curve: 'basis',
  },
});

function svgToCanvas(svgString: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('No canvas context'));

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

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
      const canvas = await svgToCanvas(svgContent);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
      a.click();
      toast.success('PNG downloaded');
    } catch {
      toast.error('PNG download failed — try SVG instead');
    }
  };

  const handleDownloadPDF = async () => {
    if (!svgContent) return;
    try {
      const canvas = await svgToCanvas(svgContent);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width / 2 + 40, canvas.height / 2 + 80],
      });
      pdf.setFontSize(16);
      pdf.text(title, 20, 24);
      if (description) {
        pdf.setFontSize(10);
        pdf.text(description, 20, 40);
      }
      const yOffset = description ? 50 : 34;
      pdf.addImage(imgData, 'PNG', 20, yOffset, canvas.width / 2, canvas.height / 2);
      pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF download failed — try SVG instead');
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
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <FileText className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">PDF</span>
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
