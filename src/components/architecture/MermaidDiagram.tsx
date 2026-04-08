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

interface SvgExportData {
  svgString: string;
  width: number;
  height: number;
}

const EXPORT_SCALE = 2;
const EXPORT_BACKGROUND = '#0f172a';

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
    actorTextColor: '#f8fafc',
    actorBkg: '#1e293b',
    actorBorder: '#64748b',
    signalColor: '#f8fafc',
    signalTextColor: '#f8fafc',
    noteBkgColor: '#334155',
    noteTextColor: '#f8fafc',
    noteBorderColor: '#64748b',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: false,
    curve: 'basis',
    nodeSpacing: 30,
    rankSpacing: 50,
    wrappingWidth: 160,
  },
  sequence: {
    useMaxWidth: true,
    wrap: true,
    wrapPadding: 10,
    width: 180,
    boxMargin: 8,
    noteMargin: 10,
    messageMargin: 30,
  },
});

const TIER_LEGEND = [
  { label: 'Core', color: '#059669', border: '#34d399' },
  { label: 'Boost', color: '#0284c7', border: '#38bdf8' },
  { label: 'Pro', color: '#7c3aed', border: '#a78bfa' },
  { label: 'Elite', color: '#b45309', border: '#f59e0b' },
  { label: 'System', color: '#334155', border: '#64748b' },
  { label: 'External', color: '#be123c', border: '#fb7185' },
  { label: 'Entry', color: '#0d9488', border: '#2dd4bf' },
];

function sanitizeFilename(value: string, extension: string) {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'diagram';

  return `${base}.${extension}`;
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function parseSvgLength(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializeSvgForExport(svgElement: SVGSVGElement): SvgExportData {
  const bounds = svgElement.getBoundingClientRect();
  const viewBox = svgElement.viewBox.baseVal;
  const width = Math.max(
    Math.ceil(bounds.width),
    Math.ceil(viewBox?.width || 0),
    Math.ceil(parseSvgLength(svgElement.getAttribute('width')) || 0),
    1,
  );
  const height = Math.max(
    Math.ceil(bounds.height),
    Math.ceil(viewBox?.height || 0),
    Math.ceil(parseSvgLength(svgElement.getAttribute('height')) || 0),
    1,
  );

  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', `${width}`);
  clone.setAttribute('height', `${height}`);
  clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  clone.style.maxWidth = 'none';
  clone.style.backgroundColor = EXPORT_BACKGROUND;

  const svgString = `<?xml version="1.0" encoding="UTF-8"?>${new XMLSerializer().serializeToString(clone)}`;

  return { svgString, width, height };
}

function svgToCanvas({ svgString, width, height }: SvgExportData): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No canvas context'));
      return;
    }

    const canvasWidth = Math.max(1, Math.round(width * EXPORT_SCALE));
    const canvasHeight = Math.max(1, Math.round(height * EXPORT_SCALE));
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      ctx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0);
      ctx.fillStyle = EXPORT_BACKGROUND;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image load failed'));
    };

    image.src = objectUrl;
  });
}

export function MermaidDiagram({ chart, title, description }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const uniqueId = useId().replace(/:/g, '');

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      containerRef.current.innerHTML = '';

      try {
        const cleanId = `mermaid${uniqueId}`;
        const { svg } = await mermaid.render(cleanId, chart);
        containerRef.current.innerHTML = svg;
      } catch (error) {
        console.error('Mermaid render error:', error);
        containerRef.current.innerHTML = '<p class="text-destructive">Failed to render diagram</p>';
      }
    };

    renderDiagram();
  }, [chart, uniqueId]);

  const getExportData = () => {
    const svgElement = containerRef.current?.querySelector('svg');

    if (!svgElement) {
      throw new Error('Diagram not ready');
    }

    return serializeSvgForExport(svgElement);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(chart);
    setCopied(true);
    toast.success('Mermaid code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    try {
      const { svgString } = getExportData();
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, sanitizeFilename(title, 'svg'));
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('SVG downloaded');
    } catch {
      toast.error('SVG download failed');
    }
  };

  const handleDownloadPNG = async () => {
    try {
      const canvas = await svgToCanvas(getExportData());
      const pngUrl = canvas.toDataURL('image/png');
      triggerDownload(pngUrl, sanitizeFilename(title, 'png'));
      toast.success('PNG downloaded');
    } catch (error) {
      console.error('PNG download failed:', error);
      toast.error('PNG download failed - try SVG instead');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const exportData = getExportData();
      const canvas = await svgToCanvas(exportData);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: exportData.width >= exportData.height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const titleSpace = description ? 42 : 28;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2 - titleSpace;
      const scale = Math.min(availableWidth / exportData.width, availableHeight / exportData.height);
      const imageWidth = exportData.width * scale;
      const imageHeight = exportData.height * scale;
      const imageX = (pageWidth - imageWidth) / 2;
      const imageY = margin + titleSpace;

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.setTextColor(248, 250, 252);
      pdf.setFontSize(16);
      pdf.text(title, margin, margin);

      if (description) {
        pdf.setFontSize(10);
        pdf.setTextColor(148, 163, 184);
        pdf.text(description, margin, margin + 16);
      }

      pdf.addImage(imgData, 'PNG', imageX, imageY, imageWidth, imageHeight);
      pdf.save(sanitizeFilename(title, 'pdf'));
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('PDF download failed - try SVG instead');
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
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

      <div className="mb-3 flex flex-wrap gap-3 px-1">
        {TIER_LEGEND.map((tier) => (
          <div key={tier.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm border"
              style={{ backgroundColor: tier.color, borderColor: tier.border }}
            />
            <span className="text-xs text-muted-foreground">{tier.label}</span>
          </div>
        ))}
      </div>

      <div
        ref={containerRef}
        className="min-h-[200px] overflow-x-auto rounded-md bg-background/50 p-4"
      />
    </div>
  );
}
