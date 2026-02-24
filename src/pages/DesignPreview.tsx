import { useState } from "react";
import { Users, Wrench, BarChart3, Briefcase, Mail, Phone, User, ChevronDown, Zap, Shield, Brain, TrendingUp } from "lucide-react";

// ============================================================
// DESIGN PREVIEW PAGE
// Standalone visual demo — does NOT affect any other pages.
// Navigate to /design-preview to see the new dark-tech aesthetic.
// ============================================================

const consoles = [
  {
    title: "Customer Portal",
    desc: "AI-powered customer communication hub",
    icon: Users,
    neonColor: "#00BFFF",
    neonShadow: "0 0 20px rgba(0,191,255,0.5), 0 0 40px rgba(0,191,255,0.2)",
    borderHover: "rgba(0,191,255,0.6)",
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    title: "Field Ops",
    desc: "Dispatch and technician management",
    icon: Wrench,
    neonColor: "#22c55e",
    neonShadow: "0 0 20px rgba(34,197,94,0.5), 0 0 40px rgba(34,197,94,0.2)",
    borderHover: "rgba(34,197,94,0.6)",
    gradient: "from-green-600 to-emerald-500",
  },
  {
    title: "Business Ops",
    desc: "Operations intelligence and automation",
    icon: Briefcase,
    neonColor: "#a855f7",
    neonShadow: "0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2)",
    borderHover: "rgba(168,85,247,0.6)",
    gradient: "from-purple-600 to-violet-500",
  },
  {
    title: "Analytics",
    desc: "Revenue insights and performance metrics",
    icon: BarChart3,
    neonColor: "#06b6d4",
    neonShadow: "0 0 20px rgba(6,182,212,0.5), 0 0 40px rgba(6,182,212,0.2)",
    borderHover: "rgba(6,182,212,0.6)",
    gradient: "from-cyan-600 to-teal-500",
  },
];

const stats = [
  { label: "Total Revenue", value: "$48,290", change: "+12.4%", positive: true, color: "#00BFFF" },
  { label: "Active Clients", value: "1,247", change: "+8.1%", positive: true, color: "#22c55e" },
  { label: "Appointments", value: "386", change: "+5.3%", positive: true, color: "#a855f7" },
  { label: "Avg Response", value: "1.2s", change: "-0.3s", positive: true, color: "#06b6d4" },
];

export default function DesignPreview() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [formFocused, setFormFocused] = useState<string | null>(null);

  return (
    <div style={{ background: "linear-gradient(135deg, hsl(208,32%,8%) 0%, hsl(220,35%,9%) 50%, hsl(208,32%,8%) 100%)", minHeight: "100vh", fontFamily: "system-ui, sans-serif", color: "white" }}>

      {/* === TOP NAV BAR === */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(12px)", background: "rgba(10,15,25,0.7)", position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase" }}>Design Preview</span>
        <span style={{ fontSize: 13, padding: "4px 12px", borderRadius: 20, background: "rgba(0,191,255,0.12)", border: "1px solid rgba(0,191,255,0.3)", color: "#00BFFF" }}>No changes to live site</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ============================================================ */}
        {/* SECTION 1 — HERO DEMO */}
        {/* ============================================================ */}
        <SectionLabel label="Section 1 — Hero" />

        <div style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          padding: "72px 48px",
          marginBottom: 64,
          background: "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(33,78,187,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 80%, rgba(0,191,255,0.15) 0%, transparent 60%), hsl(208,32%,8%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          {/* Grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4,
            backgroundImage: "linear-gradient(rgba(33,78,187,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(33,78,187,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: 3, height: 3,
              borderRadius: "50%",
              background: i % 2 === 0 ? "#00BFFF" : "#214ebb",
              opacity: 0.4,
              top: `${15 + i * 13}%`,
              left: `${10 + i * 14}%`,
              filter: "blur(0.5px)",
              animation: `float-${i} ${6 + i}s ease-in-out infinite`,
            }} />
          ))}

          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            {/* Eyebrow */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: "rgba(0,191,255,0.1)", border: "1px solid rgba(0,191,255,0.25)", marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00BFFF", boxShadow: "0 0 8px #00BFFF" }} />
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#00BFFF" }}>AI-Powered Platform</span>
            </div>

            {/* Main title */}
            <h1 style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 800,
              letterSpacing: -1,
              margin: "0 0 16px",
              background: "linear-gradient(135deg, #00F2FF 0%, #214ebb 45%, #46a2d3 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 30px rgba(0,191,255,0.3))",
            }}>
              AURA INTERCEPT
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.6 }}>
              The AI command center that runs your entire business — from first contact to final invoice.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {/* Primary — animated gradient border */}
              <button style={{
                padding: "14px 32px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: "linear-gradient(135deg, #214ebb, #00BFFF, #46a2d3, #214ebb)",
                backgroundSize: "300% 300%",
                color: "white",
                animation: "border-shine 3s ease infinite",
                boxShadow: "0 0 24px rgba(0,191,255,0.35)",
              }}>
                Start Free Trial →
              </button>
              {/* Secondary — glass */}
              <button style={{
                padding: "14px 32px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
              }}>
                Watch Demo
              </button>
            </div>

            {/* Trust bar */}
            <div style={{ marginTop: 40, display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
              {["98.9% Uptime", "< 1.2s AI Response", "SOC 2 Ready", "500+ Businesses"].map((t) => (
                <span key={t} style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 2 — CONSOLE CARDS */}
        {/* ============================================================ */}
        <SectionLabel label="Section 2 — Console Cards" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 64 }}>
          {consoles.map((c, i) => {
            const Icon = c.icon;
            const isHovered = hoveredCard === i;
            return (
              <div
                key={c.title}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  borderRadius: 14,
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  background: isHovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(20px)",
                  border: isHovered ? `1px solid ${c.borderHover}` : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isHovered ? c.neonShadow : "none",
                  transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${c.neonColor}22, ${c.neonColor}44)`, border: `1px solid ${c.neonColor}44`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={20} style={{ color: c.neonColor }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{c.desc}</div>
                <div style={{ marginTop: 16, fontSize: 12, color: c.neonColor, opacity: isHovered ? 1 : 0, transition: "opacity 0.2s" }}>Open Console →</div>
              </div>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* SECTION 3 — STAT CARDS */}
        {/* ============================================================ */}
        <SectionLabel label="Section 3 — Dashboard Stat Cards" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 64 }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              borderRadius: 14,
              padding: "20px 22px",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Subtle glow corner */}
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: s.color, opacity: 0.08, filter: "blur(20px)" }} />
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5, marginBottom: 8 }}>{s.label}</div>
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                background: `linear-gradient(135deg, ${s.color}, white)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: 6,
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: s.positive ? "#22c55e" : "#ef4444" }}>
                {s.change} vs last month
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* SECTION 4 — FORM INPUTS */}
        {/* ============================================================ */}
        <SectionLabel label="Section 4 — Form Inputs" />

        <div style={{
          borderRadius: 16,
          padding: "32px",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 64,
          maxWidth: 540,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 24 }}>New Appointment</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Full Name", placeholder: "Jane Smith", icon: User, id: "name" },
              { label: "Email Address", placeholder: "jane@example.com", icon: Mail, id: "email" },
              { label: "Phone Number", placeholder: "(555) 000-0000", icon: Phone, id: "phone" },
            ].map((f) => {
              const Icon = f.icon;
              const isFocused = formFocused === f.id;
              return (
                <div key={f.id} style={{ gridColumn: f.id === "name" ? "1 / -1" : undefined }}>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <div style={{ position: "relative" }}>
                    <Icon size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: isFocused ? "#00BFFF" : "rgba(255,255,255,0.3)", transition: "color 0.2s" }} />
                    <input
                      placeholder={f.placeholder}
                      onFocus={() => setFormFocused(f.id)}
                      onBlur={() => setFormFocused(null)}
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 34px",
                        borderRadius: 8,
                        border: isFocused ? "1px solid rgba(0,191,255,0.6)" : "1px solid rgba(255,255,255,0.1)",
                        background: isFocused ? "rgba(0,191,255,0.07)" : "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.9)",
                        fontSize: 14,
                        outline: "none",
                        boxShadow: isFocused ? "0 0 0 3px rgba(0,191,255,0.15)" : "none",
                        transition: "all 0.2s",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {/* Dropdown */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Service Type</label>
              <div style={{ position: "relative" }}>
                <select
                  onFocus={() => setFormFocused("service")}
                  onBlur={() => setFormFocused(null)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: formFocused === "service" ? "1px solid rgba(0,191,255,0.6)" : "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(20,30,50,0.9)",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 14,
                    outline: "none",
                    boxShadow: formFocused === "service" ? "0 0 0 3px rgba(0,191,255,0.15)" : "none",
                    transition: "all 0.2s",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Select a service…</option>
                  <option>HVAC Maintenance</option>
                  <option>Plumbing Repair</option>
                  <option>Electrical Inspection</option>
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button style={{
            marginTop: 20,
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            background: "linear-gradient(135deg, #214ebb, #00BFFF, #46a2d3, #214ebb)",
            backgroundSize: "300% 300%",
            color: "white",
            animation: "border-shine 3s ease infinite",
            boxShadow: "0 0 20px rgba(0,191,255,0.3)",
          }}>
            Book Appointment
          </button>
        </div>

        {/* ============================================================ */}
        {/* SECTION 5 — SIDE-BY-SIDE COMPARISON */}
        {/* ============================================================ */}
        <SectionLabel label="Section 5 — Before vs After" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 64 }}>
          {/* BEFORE */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 12, textAlign: "center" }}>⬅ Current Design</div>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ background: "#f8fafc", padding: "32px 24px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1e3a8a", marginBottom: 8 }}>AURA INTERCEPT</div>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>The pulse of your business</div>
                <button style={{ padding: "10px 24px", background: "#1e3a8a", color: "white", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Get Started</button>
              </div>
              <div style={{ background: "white", padding: "16px 24px", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  {["Customers", "Field Ops", "Analytics"].map((t) => (
                    <div key={t} style={{ flex: 1, padding: "14px 10px", background: "#f1f5f9", borderRadius: 8, textAlign: "center", fontSize: 12, color: "#475569", fontWeight: 600 }}>{t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AFTER */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#00BFFF", marginBottom: 12, textAlign: "center" }}>New Design ➡</div>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,191,255,0.25)", boxShadow: "0 0 30px rgba(0,191,255,0.1)" }}>
              <div style={{
                padding: "32px 24px",
                background: "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(33,78,187,0.35) 0%, transparent 70%), hsl(208,32%,10%)",
                backgroundImage: "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(33,78,187,0.35) 0%, transparent 70%), linear-gradient(rgba(33,78,187,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(33,78,187,0.06) 1px, transparent 1px), linear-gradient(135deg, hsl(208,32%,10%), hsl(220,35%,11%))",
                backgroundSize: "auto, 40px 40px, 40px 40px, auto",
              }}>
                <div style={{
                  fontSize: 22, fontWeight: 800, marginBottom: 8,
                  background: "linear-gradient(135deg, #00F2FF 0%, #214ebb 45%, #46a2d3 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>AURA INTERCEPT</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>The pulse of your business</div>
                <button style={{ padding: "10px 24px", background: "linear-gradient(135deg, #214ebb, #00BFFF)", color: "white", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", boxShadow: "0 0 16px rgba(0,191,255,0.4)" }}>Get Started</button>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  {[{ t: "Customers", c: "#00BFFF" }, { t: "Field Ops", c: "#22c55e" }, { t: "Analytics", c: "#06b6d4" }].map((item) => (
                    <div key={item.t} style={{ flex: 1, padding: "14px 10px", background: "rgba(255,255,255,0.04)", border: `1px solid ${item.c}33`, borderRadius: 8, textAlign: "center", fontSize: 12, color: item.c, fontWeight: 600, backdropFilter: "blur(8px)" }}>{item.t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* APPROVAL BAR */}
        {/* ============================================================ */}
        <div style={{
          borderRadius: 16,
          padding: "24px 32px",
          background: "rgba(0,191,255,0.06)",
          border: "1px solid rgba(0,191,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>Ready to apply this across the platform?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Tell me to proceed, or request specific tweaks first.</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ padding: "8px 20px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 13, color: "rgba(255,255,255,0.6)", cursor: "default" }}>Request Tweaks</div>
            <div style={{ padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg, #214ebb, #00BFFF)", fontSize: 13, color: "white", fontWeight: 600, cursor: "default", boxShadow: "0 0 16px rgba(0,191,255,0.3)" }}>Apply Platform-Wide ✓</div>
          </div>
        </div>

      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes border-shine {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
        select option { background: hsl(208,32%,12%); color: white; }
      `}</style>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}
