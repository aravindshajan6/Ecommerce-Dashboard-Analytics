import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import Logo from '../layout/Logo.jsx';
import GithubIcon from './GithubIcon.jsx';
import { useTheme } from '../../lib/theme.jsx';

const GITHUB = 'https://github.com/aravindshajan6/Ecommerce-Dashboard-Analytics';
const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#demo', label: 'Live demo' },
  { href: GITHUB, label: 'GitHub', external: true, icon: GithubIcon },
];

/** Sticky glass top nav that shrinks once the page scrolls. */
export default function LandingNav() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        scrolled ? 'border-b border-line/10 bg-bg/70 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.5)] backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <nav className={clsx('mx-auto flex w-full max-w-[1400px] items-center gap-4 px-4 transition-[height] duration-300 md:px-6', scrolled ? 'h-14' : 'h-[72px]')} aria-label="Landing">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Nova Commerce home">
          <Logo size={scrolled ? 28 : 32} className="transition-all duration-300" />
          <span className="font-display text-base font-semibold tracking-tight text-fg">
            Nova<span className="text-gradient">Commerce</span>
          </span>
        </Link>

        <div className="ml-6 hidden items-center gap-1 md:flex">
          {LINKS.map(({ href, label, external, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-fg-2 transition-colors hover:bg-line/5 hover:text-fg"
            >
              {Icon && <Icon size={14} />}
              {label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="btn-ghost !p-2" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/overview" className="btn-primary hidden sm:inline-flex">
            Open dashboard <ArrowRight size={14} />
          </Link>
          <button className="btn-ghost !p-2 md:hidden" onClick={() => setMenu((m) => !m)} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}>
            {menu ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {menu && (
        <div className="border-t border-line/10 bg-bg/90 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map(({ href, label, external, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                onClick={() => setMenu(false)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-fg-2 hover:bg-line/5 hover:text-fg"
              >
                {Icon && <Icon size={14} />}
                {label}
              </a>
            ))}
            <Link to="/overview" className="btn-primary mt-2 justify-center">Open dashboard <ArrowRight size={14} /></Link>
          </div>
        </div>
      )}
    </header>
  );
}
