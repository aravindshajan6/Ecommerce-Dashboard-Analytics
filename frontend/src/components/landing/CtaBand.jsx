import { Link } from 'react-router-dom';
import { ArrowRight, Command } from 'lucide-react';
import Reveal from './Reveal.jsx';
import GithubIcon from './GithubIcon.jsx';

const GITHUB = 'https://github.com/aravindshajan6/Ecommerce-Dashboard-Analytics';

export default function CtaBand() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-12 md:px-6 md:py-20">
      <Reveal each={0} y={24}>
        <div className="glass gradient-border relative overflow-hidden px-6 py-12 text-center md:px-12 md:py-16">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-teal/20 blur-3xl" aria-hidden="true" />
          <p className="eyebrow !text-primary">Ready when you are</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold text-fg md:text-[44px] md:leading-[1.08]">
            See your store <span className="text-gradient">in a new dimension.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-fg-2">
            The demo runs on a real order dataset. Open it, hit <kbd className="rounded-md border border-line/15 bg-line/5 px-1.5 py-0.5 font-mono text-[12px] text-fg">⌘K</kbd> and jump anywhere.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/overview" className="btn-primary !px-5 !py-2.5 !text-[15px]">Open dashboard <ArrowRight size={16} /></Link>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="btn-ghost !px-5 !py-2.5 !text-[15px]"><GithubIcon size={16} /> Star on GitHub</a>
          </div>
          <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-fg-3"><Command size={11} /> Command palette · keyboard-first · light &amp; dark</p>
        </div>
      </Reveal>
    </section>
  );
}
