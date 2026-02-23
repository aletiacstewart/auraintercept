import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, RotateCcw, Download, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgentNode {
  id: string;
  label: string;
  emoji: string;
  color: string;
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  label: string;
}

interface Scene {
  id: string;
  title: string;
  narration: string;
  agents: AgentNode[];
  connections: Connection[];
  highlightAgents: string[];
  highlightConnections: number[];
}

// Y coordinates use 10-90 range to stay within visible area
const scenes: Scene[] = [
  {
    id: 'scene-1',
    title: 'Customer Reaches Out',
    narration: 'A customer calls or chats with your business. The AI Receptionist (Triage Agent) answers instantly — 24/7, no hold times, no missed calls.',
    agents: [
      { id: 'customer', label: 'Customer', emoji: '👤', color: 'hsl(200, 80%, 50%)', x: 15, y: 50 },
      { id: 'triage', label: 'AI Receptionist', emoji: '🤖', color: 'hsl(260, 80%, 60%)', x: 50, y: 50 },
    ],
    connections: [{ from: 'customer', to: 'triage', label: 'Call / Chat / SMS' }],
    highlightAgents: ['customer', 'triage'],
    highlightConnections: [0],
  },
  {
    id: 'scene-2',
    title: 'Intelligent Routing',
    narration: 'The AI Receptionist qualifies the request — collects name, phone, and service type — then hands off to the right specialized agent automatically.',
    agents: [
      { id: 'customer', label: 'Customer', emoji: '👤', color: 'hsl(200, 80%, 50%)', x: 10, y: 50 },
      { id: 'triage', label: 'AI Receptionist', emoji: '🤖', color: 'hsl(260, 80%, 60%)', x: 35, y: 50 },
      { id: 'booking', label: 'Booking Agent', emoji: '📅', color: 'hsl(150, 70%, 45%)', x: 65, y: 15 },
      { id: 'followup', label: 'Follow-up Agent', emoji: '📋', color: 'hsl(30, 80%, 55%)', x: 65, y: 50 },
      { id: 'dispatch', label: 'Dispatch Agent', emoji: '🚛', color: 'hsl(0, 70%, 55%)', x: 65, y: 85 },
    ],
    connections: [
      { from: 'customer', to: 'triage', label: 'Request' },
      { from: 'triage', to: 'booking', label: 'Scheduling' },
      { from: 'triage', to: 'followup', label: 'Check-in' },
      { from: 'triage', to: 'dispatch', label: 'Urgent Service' },
    ],
    highlightAgents: ['triage', 'booking', 'followup', 'dispatch'],
    highlightConnections: [1, 2, 3],
  },
  {
    id: 'scene-3',
    title: 'Agents Take Action',
    narration: 'Each specialized agent performs real actions: booking appointments, assigning technicians with optimal routes, sending review requests, and processing follow-ups — all automatically.',
    agents: [
      { id: 'booking', label: 'Booking Agent', emoji: '📅', color: 'hsl(150, 70%, 45%)', x: 10, y: 18 },
      { id: 'dispatch', label: 'Dispatch Agent', emoji: '🚛', color: 'hsl(0, 70%, 55%)', x: 10, y: 50 },
      { id: 'followup', label: 'Follow-up Agent', emoji: '📋', color: 'hsl(30, 80%, 55%)', x: 10, y: 82 },
      { id: 'action1', label: 'Books Appointment\n& Notifies Employee', emoji: '✅', color: 'hsl(150, 50%, 35%)', x: 50, y: 12 },
      { id: 'action2', label: 'Confirms with Customer\n& Sends Reminder', emoji: '📱', color: 'hsl(150, 50%, 35%)', x: 85, y: 18 },
      { id: 'action3', label: 'Assigns Technician\n& Sends ETA', emoji: '📍', color: 'hsl(0, 50%, 40%)', x: 50, y: 50 },
      { id: 'action4', label: 'Optimizes Route\n& Updates Customer', emoji: '🗺️', color: 'hsl(0, 50%, 40%)', x: 85, y: 50 },
      { id: 'action5', label: 'Sends Review\nRequest', emoji: '⭐', color: 'hsl(30, 60%, 40%)', x: 50, y: 82 },
      { id: 'action6', label: 'Triggers Campaign\nif 5-Star', emoji: '🎯', color: 'hsl(30, 60%, 40%)', x: 85, y: 88 },
    ],
    connections: [
      { from: 'booking', to: 'action1', label: '' },
      { from: 'action1', to: 'action2', label: '' },
      { from: 'dispatch', to: 'action3', label: '' },
      { from: 'action3', to: 'action4', label: '' },
      { from: 'followup', to: 'action5', label: '' },
      { from: 'action5', to: 'action6', label: '' },
    ],
    highlightAgents: ['booking', 'dispatch', 'followup', 'action1', 'action2', 'action3', 'action4', 'action5', 'action6'],
    highlightConnections: [0, 1, 2, 3, 4, 5],
  },
  {
    id: 'scene-4',
    title: 'Everyone Benefits',
    narration: 'The company gets 24/7 coverage with zero missed leads. Customers get instant, professional service. Employees receive pre-qualified jobs with clear instructions — no wasted time.',
    agents: [
      { id: 'company', label: 'Company', emoji: '🏢', color: 'hsl(260, 80%, 60%)', x: 50, y: 15 },
      { id: 'benefit1', label: '24/7 Coverage\nNo Missed Leads', emoji: '🌙', color: 'hsl(260, 60%, 45%)', x: 15, y: 15 },
      { id: 'benefit2', label: 'Automated\nOperations', emoji: '⚡', color: 'hsl(260, 60%, 45%)', x: 85, y: 15 },
      { id: 'customer', label: 'Customer', emoji: '👤', color: 'hsl(200, 80%, 50%)', x: 50, y: 50 },
      { id: 'benefit3', label: 'Instant Service\nNo Hold Times', emoji: '🚀', color: 'hsl(200, 60%, 40%)', x: 15, y: 50 },
      { id: 'benefit4', label: 'Real-Time\nTracking', emoji: '📊', color: 'hsl(200, 60%, 40%)', x: 85, y: 50 },
      { id: 'employee', label: 'Employee', emoji: '👷', color: 'hsl(150, 70%, 45%)', x: 50, y: 85 },
      { id: 'benefit5', label: 'Pre-Qualified\nJobs', emoji: '✅', color: 'hsl(150, 50%, 35%)', x: 15, y: 85 },
      { id: 'benefit6', label: 'Clear Instructions\n& Route', emoji: '🗺️', color: 'hsl(150, 50%, 35%)', x: 85, y: 85 },
    ],
    connections: [
      { from: 'benefit1', to: 'company', label: '' },
      { from: 'company', to: 'benefit2', label: '' },
      { from: 'benefit3', to: 'customer', label: '' },
      { from: 'customer', to: 'benefit4', label: '' },
      { from: 'benefit5', to: 'employee', label: '' },
      { from: 'employee', to: 'benefit6', label: '' },
    ],
    highlightAgents: ['company', 'customer', 'employee', 'benefit1', 'benefit2', 'benefit3', 'benefit4', 'benefit5', 'benefit6'],
    highlightConnections: [0, 1, 2, 3, 4, 5],
  },
];

function AgentCard({ agent, isHighlighted, delay }: { agent: AgentNode; isHighlighted: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: isHighlighted ? 1 : 0.3, scale: isHighlighted ? 1 : 0.85 }}
      transition={{ duration: 0.5, delay }}
      className="absolute flex flex-col items-center"
      style={{ left: `${agent.x}%`, top: `${agent.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <motion.div
        animate={isHighlighted ? { boxShadow: `0 0 30px ${agent.color}40` } : {}}
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2"
        style={{
          backgroundColor: `${agent.color}20`,
          borderColor: isHighlighted ? agent.color : 'transparent',
        }}
      >
        {agent.emoji}
      </motion.div>
      <p className="mt-2 text-xs font-semibold text-center max-w-[120px] leading-tight whitespace-pre-line" style={{ color: agent.color }}>
        {agent.label}
      </p>
    </motion.div>
  );
}


export default function AIAgentFlowDemo() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  const scene = scenes[currentScene];

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isPlaying, currentScene]);

  const handleNext = useCallback(() => {
    if (currentScene < scenes.length - 1) setCurrentScene(prev => prev + 1);
  }, [currentScene]);

  const handleRestart = useCallback(() => {
    setCurrentScene(0);
    setIsPlaying(false);
  }, []);

  const downloadScript = useCallback(() => {
    const script = scenes.map((s, i) => `Scene ${i + 1}: ${s.title}\n${s.narration}\n`).join('\n---\n\n');
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-agent-flow-script.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white/70 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Aura Intelligence Network — Agent Flow Demo
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={downloadScript} className="border-white/20 text-white/70 hover:text-white">
          <Download className="w-4 h-4 mr-1" /> Script
        </Button>
      </div>

      {/* Main content - 16:9 aspect ratio */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[1200px] aspect-video relative rounded-2xl border border-white/10 bg-[#0d1220] overflow-hidden">
          {/* Scene title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id + '-title'}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-0 right-0 text-center z-10"
            >
              <span className="text-xs uppercase tracking-widest text-primary/70 font-medium">
                Scene {currentScene + 1} of {scenes.length}
              </span>
              <h2 className="text-2xl font-bold mt-1">{scene.title}</h2>
            </motion.div>
          </AnimatePresence>

          {/* Agent flow area — shared coordinate space for SVG lines and agent cards */}
          {/* Covers from below title to above narration */}
          <div className="absolute left-0 right-0 top-[16%] bottom-[20%]">
            {/* SVG lines — rendered behind cards, same percentage coordinate space */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <AnimatePresence>
                {scene.connections.map((conn, i) => {
                  const fromAgent = scene.agents.find(a => a.id === conn.from);
                  const toAgent = scene.agents.find(a => a.id === conn.to);
                  if (!fromAgent || !toAgent) return null;
                  const isHighlighted = scene.highlightConnections.includes(i);
                  return (
                    <motion.line
                      key={`${scene.id}-conn-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isHighlighted ? 0.7 : 0.15 }}
                      transition={{ duration: 0.6, delay: i * 0.15 }}
                      x1={fromAgent.x}
                      y1={fromAgent.y}
                      x2={toAgent.x}
                      y2={toAgent.y}
                      stroke="hsl(var(--primary))"
                      strokeWidth="0.6"
                      strokeDasharray="2 1.5"
                    />
                  );
                })}
              </AnimatePresence>
            </svg>

            {/* Agent cards — positioned using the same x/y percentage coords */}
            <AnimatePresence>
              {scene.agents.map((agent, i) => (
                <AgentCard
                  key={`${scene.id}-agent-${agent.id}`}
                  agent={agent}
                  isHighlighted={scene.highlightAgents.includes(agent.id)}
                  delay={i * 0.1}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Narration bar */}
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id + '-narration'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-0 right-0 px-8 z-10"
            >
              <p className="text-sm text-white/80 text-center max-w-2xl mx-auto leading-relaxed">
                {scene.narration}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Scene progress dots */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-2 z-10">
            {scenes.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentScene(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentScene ? 'bg-primary w-6' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-6">
        <Button variant="outline" size="sm" onClick={handleRestart} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
          <RotateCcw className="w-4 h-4 mr-1" /> Restart
        </Button>
        <Button
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          className="gradient-primary min-w-[120px]"
        >
          {isPlaying ? <><Pause className="w-4 h-4 mr-1" /> Pause</> : <><Play className="w-4 h-4 mr-1" /> Auto-Play</>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentScene >= scenes.length - 1}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:text-white/30"
        >
          Next <SkipForward className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
