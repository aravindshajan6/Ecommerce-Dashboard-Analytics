import { Link } from 'react-router-dom';
import GithubIcon from './GithubIcon.jsx';
import Logo from '../layout/Logo.jsx';

const GITHUB = 'https://github.com/aravindshajan6/Ecommerce-Dashboard-Analytics';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line/10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-fg-3 md:flex-row md:px-6">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span>© {year} Nova Commerce · Built by <a href={GITHUB} target="_blank" rel="noreferrer" className="font-medium text-fg-2 hover:text-fg">Aravind</a></span>
        </div>
        <nav className="flex flex-wrap items-center gap-4" aria-label="Footer">
          <a href="#features" className="hover:text-fg">Features</a>
          <a href="#demo" className="hover:text-fg">Live demo</a>
          <Link to="/overview" className="hover:text-fg">Dashboard</Link>
          <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-fg"><GithubIcon size={12} /> GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
