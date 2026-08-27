import { Suspense, lazy, useEffect } from 'react';
import LandingNav from '../components/landing/LandingNav.jsx';
import Hero from '../components/landing/Hero.jsx';
import Marquee from '../components/landing/Marquee.jsx';
import StatRibbon from '../components/landing/StatRibbon.jsx';
import Features from '../components/landing/Features.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import CohortShowcase from '../components/landing/CohortShowcase.jsx';
import GlobeSection from '../components/landing/GlobeSection.jsx';
import PodiumSection from '../components/landing/PodiumSection.jsx';
import FaqSection from '../components/landing/FaqSection.jsx';
import LiveInsights from '../components/landing/LiveInsights.jsx';
import TechStrip from '../components/landing/TechStrip.jsx';
import CtaBand from '../components/landing/CtaBand.jsx';
import Footer from '../components/landing/Footer.jsx';
import '../components/landing/landing.css';

const AuroraParticles = lazy(() => import('../components/three/AuroraParticles.jsx'));

/** Public landing page — route "/". */
export default function Landing() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Nova Commerce — See your store in a new dimension';
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="aurora" aria-hidden="true" />
      <Suspense fallback={null}><AuroraParticles /></Suspense>
      <LandingNav />
      <main>
        <Hero />
        <Marquee />
        <StatRibbon />
        <Features />
        <HowItWorks />
        <GlobeSection />
        <CohortShowcase />
        <PodiumSection />
        <LiveInsights />
        <FaqSection />
        <TechStrip />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
