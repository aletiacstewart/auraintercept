import { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

async function captureContainerCanvas(container: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(container, {
    backgroundColor: EXPORT_BACKGROUND,
    scale: EXPORT_SCALE,
    useCORS: true,
    logging: false,
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
        enhanceSvg(containerRef.current.querySelector('svg'));
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
      const container = containerRef.current?.querySelector('svg')?.parentElement;
      if (!container) throw new Error('Diagram not ready');
      const canvas = await captureContainerCanvas(container);
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
      const container = containerRef.current?.querySelector('svg')?.parentElement;
      if (!container) throw new Error('Diagram not ready');
      const canvas = await captureContainerCanvas(container);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width / EXPORT_SCALE;
      const imgHeight = canvas.height / EXPORT_SCALE;
      const pdf = new jsPDF({
        orientation: imgWidth >= imgHeight ? 'landscape' : 'portrait',
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
      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const imageWidth = imgWidth * scale;
      const imageHeight = imgHeight * scale;
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
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-card/80 p-4 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.45)] backdrop-blur-sm">
      {/* Cyber-Sentry corner accents */}
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-primary/70" />
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-primary/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-primary/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-primary/70" />
      {/* Scanline overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, hsl(var(--primary)) 0 1px, transparent 1px 4px)',
        }}
      />

      <div className="relative mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            LIVE
          </span>
          <div>
            <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
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

      <div className="relative mb-3 flex flex-wrap gap-3 px-1">
        {TIER_LEGEND.map((tier) => (
          <div
            key={tier.label}
            className="flex items-center gap-1.5 rounded-md border px-2 py-0.5 transition-all hover:scale-105"
            style={{
              borderColor: tier.border,
              boxShadow: `0 0 12px -2px ${tier.border}55, inset 0 0 8px -4px ${tier.border}88`,
              background: `linear-gradient(135deg, ${tier.color}22, transparent)`,
            }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: tier.border, boxShadow: `0 0 6px ${tier.border}` }}
            />
            <span className="text-xs font-mono uppercase tracking-wide text-foreground/90">{tier.label}</span>
          </div>
        ))}
      </div>

      <div
        ref={containerRef}
        className="cyber-mermaid relative min-h-[200px] overflow-x-auto rounded-md border border-primary/20 bg-background/60 p-4"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.18) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
    </div>
  );
}

/**
 * Inject Cyber-Sentry visuals into the freshly rendered Mermaid SVG:
 *  - per-tier glow filters with animated stdDeviation
 *  - dashed "data-flow" animation on edges
 *  - subtle node breathing animation
 * All <style> + <animate> tags live inside the SVG so SVG exports keep the motion.
 */
function enhanceSvg(svg: SVGSVGElement | null) {
  if (!svg) return;

  // Ensure <defs> exists
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }

  // Tier glow filters (one shared filter — color comes from the node's own stroke)
  if (!svg.querySelector('#cyber-glow')) {
    defs.insertAdjacentHTML(
      'beforeend',
      `<filter id="cyber-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.4" result="blur">
          <animate attributeName="stdDeviation" values="1.6;3.4;1.6" dur="3.2s" repeatCount="indefinite"/>
        </feGaussianBlur>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>`,
    );
  }

  // Apply glow to all node shapes
  svg
    .querySelectorAll('g.node rect, g.node circle, g.node polygon, g.node path, g.cluster rect')
    .forEach((el) => {
      (el as SVGElement).setAttribute('filter', 'url(#cyber-glow)');
    });

  // Inject scoped style for edge dataflow + hover lift
  if (!svg.querySelector('style[data-cyber]')) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.setAttribute('data-cyber', 'true');
    style.textContent = `
      @keyframes cyberDataflow { to { stroke-dashoffset: -180; } }
      @keyframes cyberPulse { 0%,100% { opacity: 1 } 50% { opacity: .78 } }
      .flowchart-link, .edgePath path.path, .messageLine0, .messageLine1, .relationshipLine {
        stroke-dasharray: 6 8;
        animation: cyberDataflow 4s linear infinite;
        stroke-width: 1.6px;
      }
      g.node { transition: transform .25s ease; transform-origin: center; transform-box: fill-box; animation: cyberPulse 4s ease-in-out infinite; }
      g.node:hover { transform: translateY(-2px) scale(1.03); }
      g.node:hover rect, g.node:hover circle, g.node:hover polygon { stroke-width: 3px; }
      .cluster rect { stroke-dasharray: 4 4; opacity: .85; }
      .edgeLabel { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
}
