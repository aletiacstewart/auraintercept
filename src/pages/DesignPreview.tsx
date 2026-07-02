import { useState } from "react";
import { Users, Wrench, BarChart3, Briefcase, Mail, Phone, User, ChevronDown, Zap, Shield, Brain, TrendingUp, Bot, Headphones, Calendar, FileText } from "lucide-react";
import heroAgents from "@/assets/hero-agents.jpeg";
import heroLogo from "@/assets/hero-logo.jpeg";

// ============================================================
// DESIGN PREVIEW PAGE — Cinematic Dark-Tech Aesthetic
// Uses the cyan-neon-on-deep-dark palette from brand references.
// Navigate to /design-preview to see the new aesthetic.
// ============================================================

const consoles = [
  { title: "Customer Portal", desc: "AI customer communication hub", icon: Users, neonColor: "#00E5FF", neonShadow: "0 0 24px rgba(0,229,255,0.45), 0 0 60px rgba(0,229,255,0.15)", borderHover: "rgba(0,229,255,0.55)" },
  { title: "Field Ops", desc: "Dispatch and technician management", icon: Wrench, neonColor: "#00E676", neonShadow: "0 0 24px rgba(0,230,118,0.45), 0 0 60px rgba(0,230,118,0.15)", borderHover: "rgba(0,230,118,0.55)" },
  { title: "Business Ops", desc: "Operations intelligence and automation", icon: Briefcase, neonColor: "#B388FF", neonShadow: "0 0 24px rgba(179,136,255,0.45), 0 0 60px rgba(179,136,255,0.15)", borderHover: "rgba(179,136,255,0.55)" },
  { title: "Analytics", desc: "Revenue insights and performance metrics", icon: BarChart3, neonColor: "#18FFFF", neonShadow: "0 0 24px rgba(24,255,255,0.45), 0 0 60px rgba(24,255,255,0.15)", borderHover: "rgba(24,255,255,0.55)" },
];

const stats = [
  { label: "Total Revenue", value: "$48,290", change: "+12.4%", positive: true, color: "#00E5FF" },
  { label: "Active Clients", value: "1,247", change: "+8.1%", positive: true, color: "#00E676" },
  { label: "Appointments", value: "386", change: "+5.3%", positive: true, color: "#B388FF" },
  { label: "Avg Response", value: "1.2s", change: "-0.3s", positive: true, color: "#18FFFF" },
];

const agents = [
  { name: "Booking Agent", desc: "Handles booking, rescheduling & cancellations", icon: Calendar, status: "active", confidence: 96 },
  { name: "Support Agent", desc: "Customer inquiries & ticket resolution", icon: Headphones, status: "active", confidence: 94 },
  { name: "Dispatch/GPS Console", desc: "Smart technician routing & assignment", icon: Wrench, status: "active", confidence: 91 },
  { name: "Billing Agent", desc: "Invoicing, payments & estimates", icon: FileText, status: "learning", confidence: 87 },
];

export default function DesignPreview() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [formFocused, setFormFocused] = useState<string | null>(null);

  return (
    <div style={{
      background: "radial-gradient(ellipse 120% 80% at 50% 0%, hsl(200,60%,6%) 0%, hsl(210,40%,4%) 50%, hsl(220,30%,3%) 100%)",
      minHeight: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "white",
    }}>

      {/* === STICKY NAV BAR === */}
      <div style={{
        borderBottom: "1px solid rgba(0,229,255,0.08)",
        padding: "12px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backdropFilter: "blur(16px)",
        background: "rgba(4,10,20,0.85)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <span style={{ fontSize: 13, color: "rgba(0,229,255,0.5)", letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Design Preview</span>
        <span style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", color: "#00E5FF" }}>
          No changes to live site
        </span>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 100px" }}>

        {/* ================================================================
            SECTION 1 — CINEMATIC HERO WITH BRAND IMAGES
            ================================================================ */}
        <SectionLabel label="Section 1 — Cinematic Hero" />

        <div style={{
          position: "relative",
          borderRadius: 24,
          overflow: "hidden",
          marginBottom: 80,
          border: "1px solid rgba(0,229,255,0.1)",
        }}>
          {/* Background image layer */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${heroAgents})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(1.0) saturate(1.2)",
          }} />
          {/* Gradient overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(4,10,20,0.05) 0%, rgba(4,10,20,0.3) 45%, rgba(4,10,20,0.82) 100%)",
          }} />
          {/* Cyan scan line effect */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,229,255,0.01) 3px, rgba(0,229,255,0.01) 4px)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1, padding: "80px 48px 72px", textAlign: "center" }}>
            {/* Logo badge */}
            <div style={{ display: "inline-block", marginBottom: 28 }}>
              <img
                src={heroLogo}
                alt="Aura Intercept"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(0,229,255,0.3)",
                  boxShadow: "0 0 40px rgba(0,229,255,0.3), 0 0 80px rgba(0,229,255,0.1)",
                }}
              />
            </div>

            {/* Eyebrow */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 18px",
              borderRadius: 24,
              background: "rgba(0,229,255,0.08)",
              border: "1px solid rgba(0,229,255,0.2)",
              marginBottom: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E5FF", boxShadow: "0 0 10px #00E5FF" }} />
              <span style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#00E5FF", fontWeight: 600 }}>AI Command Center</span>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: "clamp(40px, 7vw, 80px)",
              fontWeight: 900,
              letterSpacing: 2,
              margin: "0 0 16px",
              background: "linear-gradient(135deg, #00F2FF 0%, #FFFFFF 30%, #00E5FF 60%, #00E5FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(0,229,255,0.4))",
            }}>
              AURA INTERCEPT
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 18,
              color: "rgba(200,230,255,0.7)",
              maxWidth: 560,
              margin: "0 auto 40px",
              lineHeight: 1.7,
              fontWeight: 400,
            }}>
              The AI command center that runs your entire business — from first contact to final invoice.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <button style={{
                padding: "16px 36px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                background: "linear-gradient(135deg, #00E5FF, #00E5FF, #00B8D4, #00E5FF)",
                backgroundSize: "300% 300%",
                color: "white",
                animation: "border-shine 4s ease infinite",
                boxShadow: "0 0 30px rgba(0,229,255,0.4), 0 4px 20px rgba(0,0,0,0.4)",
                letterSpacing: 1,
              }}>
                START 60-DAY LIVE TRIAL →
              </button>
              <button style={{
                padding: "16px 36px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                background: "rgba(0,229,255,0.06)",
                border: "1px solid rgba(0,229,255,0.2)",
                color: "rgba(200,230,255,0.9)",
                backdropFilter: "blur(16px)",
                letterSpacing: 0.5,
              }}>
                Watch Demo
              </button>
            </div>

            {/* Trust bar */}
            <div style={{ marginTop: 48, display: "flex", gap: 36, justifyContent: "center", flexWrap: "wrap" }}>
              {["98.9% Uptime", "< 1.2s AI Response", "SOC 2 Ready", "500+ Businesses"].map((t) => (
                <span key={t} style={{ fontSize: 11, color: "rgba(0,229,255,0.4)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================
            SECTION 2 — CONSOLE CARDS
            ================================================================ */}
        <SectionLabel label="Section 2 — Console Cards" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 80 }}>
          {consoles.map((c, i) => {
            const Icon = c.icon;
            const isHovered = hoveredCard === i;
            return (
              <div
                key={c.title}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  borderRadius: 16,
                  padding: "28px",
                  cursor: "pointer",
                  transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
                  background: isHovered ? "rgba(0,229,255,0.05)" : "rgba(255,255,255,0.02)",
                  backdropFilter: "blur(24px)",
                  border: isHovered ? `1px solid ${c.borderHover}` : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isHovered ? c.neonShadow : "0 0 0 1px rgba(255,255,255,0.12), 0 0 18px rgba(255,255,255,0.06)",
                  transform: isHovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `radial-gradient(circle at center, ${c.neonColor}18, ${c.neonColor}08)`,
                  border: `1px solid ${c.neonColor}33`,
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
                }}>
                  <Icon size={22} style={{ color: c.neonColor }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 8 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: "rgba(200,220,240,0.5)", lineHeight: 1.6 }}>{c.desc}</div>
                <div style={{ marginTop: 18, fontSize: 12, color: c.neonColor, opacity: isHovered ? 1 : 0, transition: "opacity 0.25s", fontWeight: 600, letterSpacing: 1 }}>
                  OPEN CONSOLE →
                </div>
              </div>
            );
          })}
        </div>

        {/* ================================================================
            SECTION 3 — AI AGENTS
            ================================================================ */}
        <SectionLabel label="Section 3 — AI Operatives" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 80 }}>
          {agents.map((a, i) => {
            const Icon = a.icon;
            const isHovered = hoveredAgent === i;
            const statusColor = a.status === "active" ? "#00E5FF" : "#FFB300";
            return (
              <div
                key={a.name}
                onMouseEnter={() => setHoveredAgent(i)}
                onMouseLeave={() => setHoveredAgent(null)}
                style={{
                  borderRadius: 16,
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
                  background: isHovered ? "rgba(0,229,255,0.04)" : "rgba(255,255,255,0.02)",
                  backdropFilter: "blur(24px)",
                  border: isHovered ? "1px solid rgba(0,229,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isHovered ? "0 0 30px rgba(0,229,255,0.2), 0 0 0 1px rgba(0,229,255,0.3)" : "0 0 0 1px rgba(255,255,255,0.12), 0 0 18px rgba(255,255,255,0.06)",
                  transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: "rgba(0,229,255,0.08)",
                    border: "1px solid rgba(0,229,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} style={{ color: "#00E5FF" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                    <span style={{ fontSize: 11, color: statusColor, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{a.status}</span>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 6 }}>{a.name}</div>
                <div style={{ fontSize: 13, color: "rgba(200,220,240,0.5)", lineHeight: 1.5, marginBottom: 14 }}>{a.desc}</div>
                {/* Confidence bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{
                      width: `${a.confidence}%`, height: "100%", borderRadius: 2,
                      background: `linear-gradient(90deg, #00E5FF, #00E5FF)`,
                      boxShadow: "0 0 8px rgba(0,229,255,0.4)",
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#00E5FF", fontWeight: 600 }}>{a.confidence}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================================================================
            SECTION 4 — STAT CARDS
            ================================================================ */}
        <SectionLabel label="Section 4 — Dashboard Stats" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 80 }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              borderRadius: 16,
              padding: "24px",
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 0 18px rgba(255,255,255,0.06)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: s.color, opacity: 0.06, filter: "blur(25px)" }} />
              <div style={{ fontSize: 12, color: "rgba(200,220,240,0.45)", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase", fontWeight: 500 }}>{s.label}</div>
              <div style={{
                fontSize: 32, fontWeight: 900,
                background: `linear-gradient(135deg, ${s.color}, rgba(255,255,255,0.9))`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                marginBottom: 8,
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: s.positive ? "#00E676" : "#FF5252", fontWeight: 600 }}>
                {s.change} vs last month
              </div>
            </div>
          ))}
        </div>

        {/* ================================================================
            SECTION 5 — FORM INPUTS
            ================================================================ */}
        <SectionLabel label="Section 5 — Form Inputs" />

        <div style={{
          borderRadius: 20,
          padding: "36px",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,229,255,0.08)",
          marginBottom: 80,
          maxWidth: 560,
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 28, letterSpacing: 0.5 }}>New Appointment</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {[
              { label: "Full Name", placeholder: "Jane Smith", icon: User, id: "name" },
              { label: "Email Address", placeholder: "jane@example.com", icon: Mail, id: "email" },
              { label: "Phone Number", placeholder: "(555) 000-0000", icon: Phone, id: "phone" },
            ].map((f) => {
              const Icon = f.icon;
              const isFocused = formFocused === f.id;
              return (
                <div key={f.id} style={{ gridColumn: f.id === "name" ? "1 / -1" : undefined }}>
                  <label style={{ fontSize: 11, color: "rgba(0,229,255,0.5)", letterSpacing: 1.5, display: "block", marginBottom: 8, textTransform: "uppercase", fontWeight: 600 }}>{f.label}</label>
                  <div style={{ position: "relative" }}>
                    <Icon size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: isFocused ? "#00E5FF" : "rgba(200,220,240,0.3)", transition: "color 0.2s" }} />
                    <input
                      placeholder={f.placeholder}
                      onFocus={() => setFormFocused(f.id)}
                      onBlur={() => setFormFocused(null)}
                      style={{
                        width: "100%",
                        padding: "12px 14px 12px 38px",
                        borderRadius: 10,
                        border: isFocused ? "1px solid rgba(0,229,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                        background: isFocused ? "rgba(0,229,255,0.05)" : "rgba(255,255,255,0.03)",
                        color: "rgba(255,255,255,0.92)",
                        fontSize: 14,
                        outline: "none",
                        boxShadow: isFocused ? "0 0 0 3px rgba(0,229,255,0.12), 0 0 20px rgba(0,229,255,0.08)" : "none",
                        transition: "all 0.25s",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 11, color: "rgba(0,229,255,0.5)", letterSpacing: 1.5, display: "block", marginBottom: 8, textTransform: "uppercase", fontWeight: 600 }}>Service Type</label>
              <div style={{ position: "relative" }}>
                <select
                  onFocus={() => setFormFocused("service")}
                  onBlur={() => setFormFocused(null)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: formFocused === "service" ? "1px solid rgba(0,229,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(4,10,20,0.95)",
                    color: "rgba(255,255,255,0.92)",
                    fontSize: 14,
                    outline: "none",
                    boxShadow: formFocused === "service" ? "0 0 0 3px rgba(0,229,255,0.12)" : "none",
                    transition: "all 0.25s",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Select a service…</option>
                  <option>HVAC Maintenance</option>
                  <option>Plumbing Repair</option>
                  <option>Electrical Inspection</option>
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(200,220,240,0.4)", pointerEvents: "none" }} />
              </div>
            </div>
          </div>
          <button style={{
            marginTop: 24,
            width: "100%",
            padding: "14px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            background: "linear-gradient(135deg, #00E5FF, #00E5FF, #00B8D4, #00E5FF)",
            backgroundSize: "300% 300%",
            color: "white",
            animation: "border-shine 4s ease infinite",
            boxShadow: "0 0 24px rgba(0,229,255,0.35)",
            letterSpacing: 1,
          }}>
            BOOK APPOINTMENT
          </button>
        </div>

        {/* ================================================================
            SECTION 6 — FEATURE HIGHLIGHTS
            ================================================================ */}
        <SectionLabel label="Section 6 — Feature Highlights" />

        <div style={{
          borderRadius: 20,
          padding: "48px",
          marginBottom: 80,
          background: "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(0,229,255,0.06) 0%, transparent 60%), rgba(255,255,255,0.02)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,229,255,0.08)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{
              fontSize: 36, fontWeight: 900, letterSpacing: 3,
              background: "linear-gradient(135deg, #00F2FF, #FFFFFF, #00E5FF)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              marginBottom: 12,
            }}>
              EVERYTHING YOUR BUSINESS NEEDS
            </h2>
            <p style={{ fontSize: 15, color: "rgba(200,220,240,0.5)", maxWidth: 480, margin: "0 auto" }}>
              24 AI Operatives working in concert to run your operations
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {[
              { icon: Zap, title: "Instant Booking", desc: "AI schedules in < 2 seconds" },
              { icon: Shield, title: "Smart Routing", desc: "GPS-optimized dispatch" },
              { icon: Brain, title: "Predictive AI", desc: "Anticipates customer needs" },
              { icon: TrendingUp, title: "Revenue Intel", desc: "Real-time business insights" },
              { icon: Bot, title: "Voice AI", desc: "Natural phone conversations" },
              { icon: Headphones, title: "24/7 Support", desc: "Never miss a customer call" },
            ].map((f, fi) => {
              const Icon = f.icon;
              const isHov = hoveredFeature === fi;
              return (
                <div
                  key={f.title}
                  onMouseEnter={() => setHoveredFeature(fi)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  style={{
                    textAlign: "center", padding: "20px 12px", borderRadius: 14, cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
                    background: isHov ? "rgba(0,229,255,0.04)" : "transparent",
                    boxShadow: isHov ? "0 0 24px rgba(0,229,255,0.25), 0 0 0 1px rgba(0,229,255,0.2)" : "0 0 0 1px rgba(255,255,255,0.1), 0 0 14px rgba(255,255,255,0.04)",
                    transform: isHov ? "translateY(-4px)" : "translateY(0)",
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: isHov ? "rgba(0,229,255,0.12)" : "rgba(0,229,255,0.06)",
                    border: isHov ? "1px solid rgba(0,229,255,0.4)" : "1px solid rgba(0,229,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 14px",
                    transition: "all 0.3s",
                  }}>
                    <Icon size={24} style={{ color: "#00E5FF" }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(200,220,240,0.45)", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color palette reference */}
        <SectionLabel label="Color Palette" />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
          {[
            { name: "Background", color: "hsl(210,40%,4%)" },
            { name: "Cyan Neon", color: "#00E5FF" },
            { name: "Royal Blue", color: "#00E5FF" },
            { name: "Sky Blue", color: "#46a2d3" },
            { name: "Green Neon", color: "#00E676" },
            { name: "Purple Neon", color: "#B388FF" },
            { name: "Teal Neon", color: "#18FFFF" },
            { name: "Warm Amber", color: "#FFB300" },
            { name: "Text Primary", color: "rgba(255,255,255,0.92)" },
            { name: "Text Muted", color: "rgba(200,220,240,0.5)" },
          ].map((c) => (
            <div key={c.name} style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: c.color, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 6 }} />
              <div style={{ fontSize: 10, color: "rgba(200,220,240,0.45)", letterSpacing: 0.5 }}>{c.name}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes border-shine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   SECTION LABEL — Debug reference strip
   ============================================================ */
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 24,
    }}>
      <div style={{ height: 1, flex: 1, background: "rgba(0,229,255,0.12)" }} />
      <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(0,229,255,0.35)", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ height: 1, flex: 1, background: "rgba(0,229,255,0.12)" }} />
    </div>
  );
}
