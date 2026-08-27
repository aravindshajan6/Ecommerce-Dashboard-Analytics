import { Sparkles } from 'lucide-react';
import { GlassCard } from '../ui/index.js';
import InsightsPanel from '../insights/InsightsPanel.jsx';
import DataCore from '../three/DataCore.jsx';

/** Auto-generated insights (/api/insights) with the floating data core in the corner. */
export default function InsightsCard({ className, limit = 5 }) {
  return (
    <GlassCard title="Insights" subtitle="What changed, and why it matters" icon={Sparkles} className={`min-h-[360px] overflow-hidden ${className ?? ''}`} bodyClassName="pt-2">
      <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-70" aria-hidden="true">
        <DataCore size={120} />
      </div>
      <div className="relative">
        <InsightsPanel limit={limit} compact />
      </div>
    </GlassCard>
  );
}
