import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { AgentOpportunityAudit } from "@/components/audit/AgentOpportunityAudit";

export default function OpportunityAudit() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <AgentOpportunityAudit />
      </main>
      <PublicFooter />
    </div>
  );
}
