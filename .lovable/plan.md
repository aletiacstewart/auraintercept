
## Add Pulse Animation to Console & How It Works Icons

Two sections still need the `animate-ping` pulse treatment:

**1. Agent Consoles section (lines 555–557)**
Wrap the existing 40×40 icon div in a `relative` container and add a `span` with `animate-ping`:
```tsx
<div style={{ position: "relative", width: 40, height: 40, marginBottom: 12 }}>
  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${neon.color}18`, border: `1px solid ${neon.color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Icon size={18} style={{ color: neon.color, position: "relative", zIndex: 1 }} />
  </div>
  <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: 10, background: `${neon.color}44`, opacity: 0.3 }} />
</div>
```

**2. How It Works section (lines 743–744)**
Wrap the 52×52 icon div similarly:
```tsx
<div style={{ position: "relative", width: 52, height: 52, margin: "0 auto 16px" }}>
  <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #00E5FF, #214ebb)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(0,229,255,0.4)" }}>
    <item.icon size={24} style={{ color: "white", position: "relative", zIndex: 1 }} />
  </div>
  <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: 16, background: "rgba(0,229,255,0.4)", opacity: 0.25 }} />
</div>
```

**File:** `src/pages/Index.tsx` — two targeted edits at lines 555–557 and 743–744.
