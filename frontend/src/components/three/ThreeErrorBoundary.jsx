import { Component } from 'react';
import StaticFallback from './StaticFallback.jsx';

/**
 * Catches WebGL / react-three-fiber failures (e.g. "Error creating WebGL context") and renders a
 * static on-brand block instead of crashing the page.
 * Props: { fallback?: ReactNode, height?, className?, message?, rounded?, children }
 */
export default class ThreeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch() {
    // Intentionally silent: the fallback is the UX. Consumers can pass `onError` if they want telemetry.
    this.props.onError?.(this.state.error);
  }

  render() {
    const { error } = this.state;
    const { children, fallback, height = '100%', className = '', message = '3D view unavailable', rounded } = this.props;
    if (error) {
      if (fallback !== undefined) return fallback;
      return <StaticFallback variant="shimmer" height={height} className={className} message={message} rounded={rounded} />;
    }
    return children;
  }
}
