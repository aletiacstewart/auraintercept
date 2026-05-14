import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { AgentOpportunityAudit } from "@/components/audit/AgentOpportunityAudit";
import { SEO } from "@/components/seo/SEO";

export default function OpportunityAudit() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Free AI Opportunity Audit | Aura Intercept"
        description="Get a personalized AI opportunity audit for your service business in minutes — no signup required."
        path="/audit"
      />
      <PublicHeader />
      <main
        className="flex-1 relative"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(0,229,255,0.08), transparent 60%), linear-gradient(180deg, hsl(var(--background)) 0%, rgba(0,229,255,0.02) 100%)",
        }}
      >
        {/* Cyber dot-grid overlay */}
        <div className="absolute inset-0 cyber-dot-grid opacity-40 pointer-events-none" />
        {/* Horizontal scanline accent */}
        <div
          className="absolute inset-x-0 top-24 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0,229,255,0.35), transparent)",
          }}
        />
        <div className="relative z-10">
          <AgentOpportunityAudit />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
