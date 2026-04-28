import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Bot, Calendar, Phone, MapPin, Clock, Send, Zap,
  FileText, AlertTriangle, Star, CreditCard, Navigation,
  Mic, MessageSquare, CheckCircle, Activity, Users, Headphones
} from 'lucide-react';

const styles = `
  @keyframes pulse-ring {
    0% { transform: scale(0.95); opacity: 0.8; }
    70% { transform: scale(1.15); opacity: 0; }
    100% { transform: scale(1.15); opacity: 0; }
  }
  @keyframes blink-dot {
    0%, 80%, 100% { opacity: 0; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1); }
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes hex-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes status-ping {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.4); }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  .pulse-ring { animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
  .typing-dot-1 { animation: blink-dot 1.4s infinite 0s; }
  .typing-dot-2 { animation: blink-dot 1.4s infinite 0.2s; }
  .typing-dot-3 { animation: blink-dot 1.4s infinite 0.4s; }
  .msg-in { animation: slide-up 0.35s ease-out; }
  .status-ping { animation: status-ping 2s ease-in-out infinite; }
  .hex-rotate { animation: hex-spin 25s linear infinite; }
  .neon-input:focus { box-shadow: 0 0 0 2px rgba(0,229,255,0.4), 0 0 20px rgba(0,229,255,0.15); }
  .action-btn:hover { box-shadow: var(--hover-glow, 0 0 20px rgba(0,229,255,0.5)); transform: translateY(-2px); }
  .action-btn { transition: all 0.2s ease; }
  .tab-pill { transition: all 0.2s ease; }
`;

const AGENTS = [
  { name: 'AI Receptionist', icon: Bot, status: 'active', color: '#00e5ff', role: 'Handles all incoming inquiries', messages: 142, responseTime: '0.8s' },
  { name: 'Booking Agent', icon: Calendar, status: 'active', color: '#10b981', role: 'Books & manages appointments', messages: 89, responseTime: '1.1s' },
  { name: 'Follow-up Agent', icon: Activity, status: 'standby', color: '#a855f7', role: 'Post-service engagement', messages: 34, responseTime: '1.4s' },
  { name: 'Review Agent', icon: Star, status: 'standby', color: '#f59e0b', role: 'Feedback & review requests', messages: 21, responseTime: '1.2s' },
];

const QUICK_ACTIONS = [
  { label: 'Schedule Appt', icon: Calendar, color: '#00e5ff', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.25)', glow: '0 0 20px rgba(0,229,255,0.45)' },
  { label: 'Get a Quote', icon: FileText, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)', glow: '0 0 20px rgba(99,102,241,0.45)' },
  { label: 'Emergency', icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', glow: '0 0 20px rgba(245,158,11,0.45)' },
  { label: 'Feedback', icon: MessageSquare, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', glow: '0 0 20px rgba(16,185,129,0.45)' },
  { label: 'Leave Review', icon: Star, color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.25)', glow: '0 0 20px rgba(236,72,153,0.45)' },
  { label: 'Track Appt', icon: Navigation, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', glow: '0 0 20px rgba(59,130,246,0.45)' },
  { label: 'Billing', icon: CreditCard, color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', glow: '0 0 20px rgba(168,85,247,0.45)' },
];

const TABS = ['AI Assistant', 'Services', 'Appointments', 'Voice AI', 'Contact', 'Hours'];

const INITIAL_MESSAGES = [
  { id: 1, role: 'agent', text: '⬡ AURA systems online. Good afternoon! I\'m your AI assistant for Acme Home Services. How can I assist you today?', time: '14:02' },
  { id: 2, role: 'user', text: 'I need to book an HVAC tune-up for next week.', time: '14:03' },
  { id: 3, role: 'agent', text: 'I\'d be happy to schedule that for you. I have availability on Tuesday the 4th at 10am, Wednesday the 5th at 2pm, or Thursday the 6th at 9am. Which works best?', time: '14:03' },
  { id: 4, role: 'user', text: 'Wednesday at 2pm works great.', time: '14:04' },
  { id: 5, role: 'agent', text: '✓ Appointment confirmed — HVAC Tune-Up on Wed, Mar 5 at 2:00 PM. A confirmation has been sent to your email. Is there anything else I can help you with?', time: '14:04' },
];

function GlassPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        borderColor: 'rgba(0,229,255,0.15)',
      }}
    >
      {children}
    </div>
  );
}

function AgentCard({ agent }: { agent: typeof AGENTS[0] }) {
  const Icon = agent.icon;
  const isActive = agent.status === 'active';
  return (
    <div
      className="rounded-lg p-3 border transition-all duration-200 cursor-default hover:border-opacity-50"
      style={{
        background: `rgba(255,255,255,0.02)`,
        borderColor: isActive ? `${agent.color}30` : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
        >
          <Icon size={14} style={{ color: agent.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white/90 truncate" style={{ fontFamily: 'monospace' }}>{agent.name}</div>
          <div className="text-[10px] text-white/40 truncate">{agent.role}</div>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isActive ? 'status-ping' : ''}`}
            style={{ background: isActive ? '#10b981' : '#f59e0b' }}
          />
          <span className="text-[10px]" style={{ color: isActive ? '#10b981' : '#f59e0b', fontFamily: 'monospace' }}>
            {isActive ? 'ACTIVE' : 'STANDBY'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="text-center rounded p-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-[10px] font-bold" style={{ color: agent.color, fontFamily: 'monospace' }}>{agent.messages}</div>
          <div className="text-[9px] text-white/30">SESSIONS</div>
        </div>
        <div className="text-center rounded p-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-[10px] font-bold" style={{ color: '#10b981', fontFamily: 'monospace' }}>{agent.responseTime}</div>
          <div className="text-[9px] text-white/30">AVG RESP</div>
        </div>
      </div>
    </div>
  );
}

export default function CyberSentryPortalMockup() {
  const [activeTab, setActiveTab] = useState('AI Assistant');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [clock, setClock] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!inputVal.trim()) return;
    const userMsg = { id: Date.now(), role: 'user' as const, text: inputVal.trim(), time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'agent', text: '⬡ Processing your request... I\'ve noted that and will connect you with the appropriate team. Is there anything else I can help you with?',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      }]);
    }, 1800);
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top left, #0a1628 0%, #060c18 50%, #020810 100%)',
        backgroundImage: `
          radial-gradient(ellipse at top left, #0a1628 0%, #060c18 50%, #020810 100%),
          radial-gradient(circle, rgba(0,229,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: 'cover, 28px 28px',
      }}
    >
      <style>{styles}</style>

      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 relative z-10"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,229,255,0.12)',
          borderTop: '3px solid rgba(0,229,255,0.7)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,229,255,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Hex Logo */}
          <div className="relative w-9 h-9">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="rgba(0,229,255,0.08)" stroke="rgba(0,229,255,0.6)" strokeWidth="1.5" />
              <polygon points="20,8 30,13.5 30,26.5 20,32 10,26.5 10,13.5" fill="none" stroke="rgba(0,229,255,0.25)" strokeWidth="1" />
            </svg>
            <Shield size={14} className="absolute inset-0 m-auto" style={{ color: '#00e5ff' }} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest" style={{ color: '#00e5ff', fontFamily: 'monospace', textShadow: '0 0 12px rgba(0,229,255,0.6)' }}>
              ACME HOME SERVICES
            </div>
            <div className="text-[10px] tracking-widest text-white/40" style={{ fontFamily: 'monospace' }}>CUSTOMER PORTAL — CYBER-SENTRY EDITION</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full pulse-ring" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span className="text-[11px] font-semibold tracking-widest" style={{ color: '#10b981', fontFamily: 'monospace' }}>PORTAL ONLINE</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded border" style={{ borderColor: 'rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.05)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00e5ff' }} />
            <span className="text-[11px] tracking-widest" style={{ color: '#00e5ff', fontFamily: 'monospace' }}>LIVE</span>
            <span className="text-[11px] ml-1" style={{ color: '#00e5ff80', fontFamily: 'monospace' }}>{clock}</span>
          </div>
        </div>
      </header>

      {/* Main 3-column grid */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden min-h-0">

        {/* LEFT — Active Agents */}
        <GlassPanel className="w-64 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
            <div className="flex items-center gap-2">
              <Users size={12} style={{ color: '#00e5ff' }} />
              <span className="text-[11px] font-bold tracking-widest text-white/70" style={{ fontFamily: 'monospace' }}>ACTIVE AGENTS</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {AGENTS.map(a => <AgentCard key={a.name} agent={a} />)}
          </div>
          {/* Session Stats */}
          <div className="p-3 border-t" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
            <div className="text-[10px] text-white/30 tracking-widest mb-2" style={{ fontFamily: 'monospace' }}>SESSION METRICS</div>
            <div className="space-y-1.5">
              {[
                { label: 'SESSION STATUS', val: 'LIVE', color: '#10b981' },
                { label: 'AVG RESPONSE', val: '<1s', color: '#00e5ff' },
                { label: 'SATISFACTION', val: '98.4%', color: '#a855f7' },
              ].map(m => (
                <div key={m.label} className="flex justify-between items-center">
                  <span className="text-[10px] text-white/30" style={{ fontFamily: 'monospace' }}>{m.label}</span>
                  <span className="text-[10px] font-bold" style={{ color: m.color, fontFamily: 'monospace' }}>{m.val}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* CENTER — Chat Interface */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0">

          {/* Tab Row */}
          <GlassPanel className="flex-shrink-0 p-1.5">
            <div className="flex items-center gap-1 overflow-x-auto">
              {TABS.map(tab => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="tab-pill flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide"
                    style={isActive ? {
                      background: 'rgba(0,229,255,0.15)',
                      color: '#00e5ff',
                      border: '1px solid rgba(0,229,255,0.4)',
                      boxShadow: '0 0 12px rgba(0,229,255,0.25)',
                      fontFamily: 'monospace',
                    } : {
                      color: 'rgba(255,255,255,0.4)',
                      border: '1px solid transparent',
                      fontFamily: 'monospace',
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          {/* Chat Area */}
          <GlassPanel className="flex-1 flex flex-col overflow-hidden">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'AI Assistant' ? (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex msg-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'agent' && (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                          style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
                          <Bot size={12} style={{ color: '#00e5ff' }} />
                        </div>
                      )}
                      <div
                        className="max-w-xs rounded-xl px-3.5 py-2.5 text-sm"
                        style={msg.role === 'agent' ? {
                          background: 'rgba(99,102,241,0.12)',
                          border: '1px solid rgba(99,102,241,0.25)',
                          color: 'rgba(255,255,255,0.9)',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          lineHeight: '1.5',
                        } : {
                          background: 'rgba(0,229,255,0.1)',
                          border: '1px solid rgba(0,229,255,0.3)',
                          color: 'rgba(255,255,255,0.9)',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          lineHeight: '1.5',
                        }}
                      >
                        {msg.text}
                        <div className="text-[10px] mt-1 opacity-40">{msg.time}</div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start msg-in">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 mt-0.5"
                        style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
                        <Bot size={12} style={{ color: '#00e5ff' }} />
                      </div>
                      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                        <div className="flex gap-1.5 items-center">
                          {[1,2,3].map(i => (
                            <div key={i} className={`w-2 h-2 rounded-full typing-dot-${i}`} style={{ background: '#00e5ff' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                /* Other tabs: placeholder panel */
                <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                  <div className="relative">
                    <svg viewBox="0 0 80 80" className="w-16 h-16 hex-rotate opacity-20">
                      <polygon points="40,4 72,22 72,58 40,76 8,58 8,22" fill="none" stroke="rgba(0,229,255,0.8)" strokeWidth="1.5" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {activeTab === 'Services' && <Zap size={22} style={{ color: '#00e5ff' }} />}
                      {activeTab === 'Appointments' && <Calendar size={22} style={{ color: '#10b981' }} />}
                      {activeTab === 'Voice AI' && <Mic size={22} style={{ color: '#a855f7' }} />}
                      {activeTab === 'Contact' && <Phone size={22} style={{ color: '#3b82f6' }} />}
                      {activeTab === 'Hours' && <Clock size={22} style={{ color: '#f59e0b' }} />}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white/60 tracking-widest mb-1" style={{ fontFamily: 'monospace' }}>{activeTab.toUpperCase()} MODULE</div>
                    <div className="text-xs text-white/30" style={{ fontFamily: 'monospace' }}>Select this tab in the live portal to view content</div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Input */}
            {activeTab === 'AI Assistant' && (
              <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message to the AI assistant..."
                    className="neon-input flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(0,229,255,0.25)',
                      color: 'rgba(255,255,255,0.85)',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
                    style={{
                      background: 'rgba(0,229,255,0.15)',
                      border: '1px solid rgba(0,229,255,0.4)',
                      boxShadow: '0 0 14px rgba(0,229,255,0.25)',
                    }}
                  >
                    <Send size={15} style={{ color: '#00e5ff' }} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-2 px-1">
                  <CheckCircle size={10} style={{ color: '#10b981' }} />
                  <span className="text-[10px] text-white/30" style={{ fontFamily: 'monospace' }}>End-to-end encrypted  ·  AI-powered  ·  Response in &lt;1s</span>
                </div>
              </div>
            )}
          </GlassPanel>
        </div>

        {/* RIGHT — Quick Actions */}
        <GlassPanel className="w-52 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
            <div className="flex items-center gap-2">
              <Zap size={12} style={{ color: '#00e5ff' }} />
              <span className="text-[11px] font-bold tracking-widest text-white/70" style={{ fontFamily: 'monospace' }}>QUICK ACTIONS</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="action-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                  style={{
                    background: action.bg,
                    border: `1px solid ${action.border}`,
                    ['--hover-glow' as string]: action.glow,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: action.bg, border: `1px solid ${action.border}` }}
                  >
                    <Icon size={14} style={{ color: action.color }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Voice AI Quick Access */}
          <div className="p-3 border-t" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
            <button
              className="action-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{
                background: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.3)',
                ['--hover-glow' as string]: '0 0 20px rgba(168,85,247,0.5)',
              }}
            >
              <Headphones size={14} style={{ color: '#a855f7' }} />
              <span className="text-[11px] font-bold tracking-wider" style={{ color: '#a855f7', fontFamily: 'monospace' }}>TALK TO AURA</span>
            </button>
          </div>
        </GlassPanel>
      </div>

      {/* Status Bar */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-1.5"
        style={{
          background: 'rgba(0,0,0,0.4)',
          borderTop: '1px solid rgba(0,229,255,0.08)',
        }}
      >
        <div className="flex items-center gap-4">
          {[
            { label: 'AI AGENTS', val: '2 ACTIVE', color: '#10b981' },
            { label: 'QUEUE', val: '0 PENDING', color: '#00e5ff' },
            { label: 'UPTIME', val: '99.98%', color: '#a855f7' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/25" style={{ fontFamily: 'monospace' }}>{s.label}:</span>
              <span className="text-[10px] font-bold" style={{ color: s.color, fontFamily: 'monospace' }}>{s.val}</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-white/20" style={{ fontFamily: 'monospace' }}>
          AURA INTERCEPT — CYBER-SENTRY v2.4.1 — CUSTOMER PORTAL MOCKUP
        </div>
      </div>
    </div>
  );
}
