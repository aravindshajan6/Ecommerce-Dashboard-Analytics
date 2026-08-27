import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/index.js';

export default function NotFound() {
  return (
    <GlassCard className="mx-auto mt-12 max-w-md text-center" gradient>
      <p className="font-display text-6xl font-bold text-gradient">404</p>
      <p className="mt-2 text-sm text-fg-2">That page drifted out of orbit.</p>
      <Link to="/overview" className="btn-primary mt-5">Back to Overview</Link>
    </GlassCard>
  );
}
