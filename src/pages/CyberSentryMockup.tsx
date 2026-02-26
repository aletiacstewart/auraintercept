import { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Shield, FileText, Users, Package, Calendar,
  BarChart2, MessageSquare, Phone, Mail, AlertTriangle, Settings,
  Activity, Cpu, TrendingUp, Lock, Wifi, Database
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type EventType = 'INTERCEPT' | 'ALERT' | 'SECURE' | 'SYSTEM';

interface EventItem {
  id: number;
  type: EventType;
  message: string;
  time: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const EVENT_POOL: Omit<EventItem, 'id' | 'time'>[] = [
  { type: 'INTERCEPT', message: 'AI blocked spam inquiry from +1-555-0192' },
  { type: 'ALERT',     message: 'Unusual login attempt detected – IP 43.21.x.x' },
  { type: 'SECURE',    message: 'Customer token rotated: acct_8f3k2' },
  { type: 'SYSTEM',    message: 'Edge function deployed: send-reminder v2.1' },
  { type: 'INTERCEPT', message: 'Duplicate booking request intercepted' },
  { type: 'SECURE',    message: 'RLS policy evaluated: 1,204 rows protected' },
  { type: 'ALERT',     message: 'Cost threshold 80% reached for SMS channel' },
  { type: 'INTERCEPT', message: 'PII scrubbed from outbound webhook payload' },
  { type: 'SYSTEM',    message: 'Realtime subscription channel opened: appts' },
  { type: 'SECURE',    message: 'Appointment confirmed: Heather M. – 10:30 AM' },
  { type: 'INTERCEPT', message: 'Rate-limit enforced on /api/book (burst +37)' },
  { type: 'SYSTEM',    message: 'Weekly digest queued: 3 companies' },
];

const WAVE_DATA = Array.from({ length: 20 }, (_, i) => ({
  t: i,
  v: Math.floor(20 + Math.random() * 60 + Math.sin(i * 0.7) * 20),
}));

const EVENT_COLOR: Record<EventType, string> = {
  INTERCEPT: '#00e5ff',
  ALERT:     '#f59e0b',
  SECURE:    '#10b981',
  SYSTEM:    '#6366f1',
};

const DOCK_BUTTONS = [
  { icon: FileText,      label: 'Quotes',      color: '#00e5ff' },
  { icon: FileText,      label: 'Invoices',    color: '#6366f1' },
  { icon: Users,         label: 'Leads',       color: '#10b981' },
  { icon: Calendar,      label: 'Appts',       color: '#f59e0b' },
  { icon: Package,       label: 'Inventory',   color: '#00e5ff' },
  { icon: Users,         label: 'Customers',   color: '#10b981' },
  { icon: BarChart2,     label: 'Analytics',   color: '#6366f1' },
  { icon: MessageSquare, label: 'Messages',    color: '#f59e0b' },
  { icon: Phone,         label: 'Calls',       color: '#00e5ff' },
  { icon: Mail,          label: 'Email',       color: '#6366f1' },
  { icon: AlertTriangle, label: 'Alerts',      color: '#f59e0b' },
  { icon: Settings,      label: 'Settings',    color: '#10b981' },
];

const GAUGES = [
  { label: 'System Health',   value: 98, color: '#10b981', icon: Activity },
  { label: 'Agent Velocity',  value: 87, color: '#00e5ff', icon: Cpu },
  { label: 'Threat Index',    value: 12, color: '#f59e0b', icon: AlertTriangle },
  { label: 'Uptime',          value: 100, color: '#6366f1', icon: TrendingUp },
];

// ── Circular Gauge ─────────────────────────────────────────────────────────────
function CircularGauge({ value, color, label, icon: Icon }: {
  value: number; color: string; label: string; icon: React.ElementType;
}) {
  const [displayed, setDisplayed] = useState(0);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayed / 100) * circ;

  useEffect(() => {
    let cur = 0;
    const step = value / 60;
    const id = setInterval(() => {
      cur += step;
      if (cur >= value) { setDisplayed(value); clearInterval(id); }
      else setDisplayed(Math.floor(cur));
    }, 16);
    return () => clearInterval(id);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <Icon size={14} style={{ color }} />
          <span className="text-sm font-bold font-mono" style={{ color }}>{displayed}%</span>
        </div>
      </div>
      <span className="text-[10px] text-center font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
    </div>
  );
}

// ── Neural Network SVG (slowly rotating) ─────────────────────────────────────
const NODES = [
  { x: 150, y: 60 }, { x: 240, y: 100 }, { x: 270, y: 200 },
  { x: 200, y: 270 }, { x: 100, y: 270 }, { x: 30, y: 200 },
  { x: 60, y: 100 },  { x: 150, y: 150 },
];
const EDGES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[0,7],[1,7],[3,7],[5,7]];

function NeuralNet() {
  return (
    <svg viewBox="0 0 300 330" className="absolute inset-0 w-full h-full opacity-25"
      style={{ animation: 'spin 25s linear infinite' }}>
      {EDGES.map(([a, b], i) => (
        <line key={i}
          x1={NODES[a].x} y1={NODES[a].y}
          x2={NODES[b].x} y2={NODES[b].y}
          stroke="#00e5ff" strokeWidth="0.8" strokeOpacity="0.6"
        />
      ))}
      {NODES.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={i === 7 ? 6 : 4}
          fill="#00e5ff" fillOpacity={i === 7 ? 0.9 : 0.5}
          style={{ filter: 'drop-shadow(0 0 4px #00e5ff)' }}
        />
      ))}
    </svg>
  );
}

// ── Hex Shield ────────────────────────────────────────────────────────────────
function HexShield() {
  // Regular hexagon points for a 90px hex centred at 100,100
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${100 + 80 * Math.cos(a)},${100 + 80 * Math.sin(a)}`;
  }).join(' ');

  return (
    <div className="relative flex items-center justify-center w-56 h-56 mx-auto">
      {/* Pulsing rings */}
      {[1, 0.7, 0.5].map((o, i) => (
        <div key={i} className="absolute rounded-full border"
          style={{
            width: `${100 + i * 40}%`, height: `${100 + i * 40}%`,
            borderColor: `rgba(0,229,255,${o * 0.3})`,
            boxShadow: `0 0 ${10 + i * 8}px rgba(0,229,255,${o * 0.2})`,
            animation: `pulse-ring ${2 + i * 0.8}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* Neural net behind hex */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
        <NeuralNet />
      </div>

      {/* Hex SVG */}
      <svg viewBox="0 0 200 200" className="relative w-44 h-44" style={{ filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.5))' }}>
        <polygon points={pts} fill="rgba(0,229,255,0.06)" stroke="#00e5ff" strokeWidth="1.5" />
      </svg>

      {/* Shield icon */}
      <div className="absolute flex flex-col items-center gap-1">
        <Shield size={40} style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 8px #00e5ff)' }} />
        <span className="text-xs font-mono font-bold" style={{ color: '#10b981', textShadow: '0 0 8px #10b981' }}>
          AURA SHIELD
        </span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CyberSentryMockup() {
  const [clock, setClock] = useState('');
  const [events, setEvents] = useState<EventItem[]>(() =>
    EVENT_POOL.slice(0, 8).map((e, i) => ({
      ...e, id: i,
      time: new Date(Date.now() - (8 - i) * 12000).toLocaleTimeString(),
    }))
  );
  const feedRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(8);

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Simulated event feed
  useEffect(() => {
    const id = setInterval(() => {
      const pool = EVENT_POOL;
      const item = pool[counterRef.current % pool.length];
      counterRef.current++;
      const newEvent: EventItem = {
        ...item,
        id: counterRef.current,
        time: new Date().toLocaleTimeString(),
      };
      setEvents(prev => [...prev.slice(-20), newEvent]);
      setTimeout(() => {
        if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }, 50);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-mono select-none overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, #0a1628 0%, #020810 100%)',
        backgroundImage: 'radial-gradient(ellipse at top, #0a1628 0%, #020810 100%), radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: 'cover, 28px 28px',
      }}>

      {/* Inline keyframes */}
      <style>{`
        @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:0.6} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes slide-left { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{
          borderBottom: '1px solid rgba(0,229,255,0.2)',
          borderTop: '3px solid #00e5ff',
          boxShadow: '0 4px 30px rgba(0,229,255,0.08), inset 0 1px 0 rgba(0,229,255,0.15)',
          background: 'rgba(0,229,255,0.03)',
        }}>
        <div className="flex items-center gap-3">
          <Shield size={22} style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 6px #00e5ff)' }} />
          <span className="text-lg font-extrabold tracking-widest" style={{ color: '#00e5ff', textShadow: '0 0 12px #00e5ff' }}>
            AURA INTERCEPT
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>▸</span>
          <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>CYBER-SENTRY COMMAND CENTER</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'blink 1.4s ease-in-out infinite', boxShadow: '0 0 6px #10b981' }} />
            <span className="text-[10px] tracking-widest" style={{ color: '#10b981' }}>LIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>{clock}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <span className="text-[10px] font-bold tracking-widest" style={{ color: '#10b981' }}>SYSTEM SECURE</span>
          </div>
        </div>
      </header>

      {/* ── Three Columns ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-3 p-4 min-h-0 overflow-hidden">

        {/* LEFT — Event Stream */}
        <div className="w-72 shrink-0 flex flex-col rounded-xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,229,255,0.15)',
            boxShadow: '0 0 30px rgba(0,229,255,0.05)',
          }}>
          <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(0,229,255,0.12)' }}>
            <Activity size={14} style={{ color: '#00e5ff' }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#00e5ff' }}>EVENT STREAM</span>
          </div>
          <div ref={feedRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin"
            style={{ scrollbarColor: 'rgba(0,229,255,0.2) transparent' }}>
            {events.map((e) => (
              <div key={e.id} className="flex gap-2 items-start rounded-lg px-2 py-1.5 text-[11px]"
                style={{
                  background: `${EVENT_COLOR[e.type]}08`,
                  border: `1px solid ${EVENT_COLOR[e.type]}22`,
                  animation: 'slide-left 0.3s ease-out',
                }}>
                <div className="shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                    style={{ background: `${EVENT_COLOR[e.type]}20`, color: EVENT_COLOR[e.type] }}>
                    {e.type}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: 'rgba(255,255,255,0.75)' }} className="leading-tight">{e.message}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)' }} className="text-[9px] mt-0.5">{e.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — Command Hub */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Secure Score */}
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="text-4xl font-extrabold tabular-nums" style={{ color: '#10b981', textShadow: '0 0 20px #10b981' }}>98%</span>
            <div>
              <p className="text-sm font-bold tracking-widest" style={{ color: '#10b981' }}>SECURE</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Overall Intercept Score</p>
            </div>
          </div>

          {/* Hex Shield */}
          <div className="flex items-center justify-center">
            <HexShield />
          </div>

          {/* Interception Wave */}
          <div className="flex-1 rounded-xl p-4 min-h-0"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,229,255,0.15)',
            }}>
            <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: '#00e5ff' }}>
              <Wifi size={10} className="inline mr-1" />INTERCEPTION WAVE
            </p>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={WAVE_DATA} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 8, fontSize: 10 }} />
                <Area type="monotone" dataKey="v" stroke="#00e5ff" strokeWidth={2} fill="url(#waveGrad)"
                  style={{ filter: 'drop-shadow(0 0 4px #00e5ff)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT — System Metrics */}
        <div className="w-64 shrink-0 flex flex-col rounded-xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,229,255,0.15)',
            boxShadow: '0 0 30px rgba(0,229,255,0.05)',
          }}>
          <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(0,229,255,0.12)' }}>
            <Database size={14} style={{ color: '#00e5ff' }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#00e5ff' }}>SYSTEM METRICS</span>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 p-4 content-start">
            {GAUGES.map(g => (
              <CircularGauge key={g.label} value={g.value} color={g.color} label={g.label} icon={g.icon} />
            ))}
          </div>
          {/* Status rows */}
          <div className="px-4 pb-4 space-y-2">
            {[
              { label: 'AI Agents', val: '6 / 6 Online', color: '#10b981' },
              { label: 'Edge Fns',  val: '14 Active',    color: '#00e5ff' },
              { label: 'Threats',   val: '0 Critical',   color: '#10b981' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-[10px]">
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>{r.label}</span>
                <span style={{ color: r.color, textShadow: `0 0 6px ${r.color}` }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tactical Dock ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-4">
        <div className="rounded-xl p-3" style={{
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,229,255,0.12)',
        }}>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {DOCK_BUTTONS.map(({ icon: Icon, label, color }) => (
              <button key={label}
                className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg transition-all duration-200 group"
                style={{
                  background: `${color}08`,
                  border: `1px solid ${color}22`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px ${color}55, inset 0 0 12px ${color}15`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}66`;
                  (e.currentTarget as HTMLElement).style.background = `${color}15`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}22`;
                  (e.currentTarget as HTMLElement).style.background = `${color}08`;
                }}
              >
                <Icon size={16} style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
                <span className="text-[9px] font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
