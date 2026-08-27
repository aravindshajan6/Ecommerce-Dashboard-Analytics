/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens backed by CSS variables (see styles/globals.css) so light/dark both work.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-hover': 'rgb(var(--card-hover) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-2': 'rgb(var(--fg-2) / <alpha-value>)',
        'fg-3': 'rgb(var(--fg-3) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        teal: 'rgb(var(--teal) / <alpha-value>)',
        pink: 'rgb(var(--pink) / <alpha-value>)',
        violet: 'rgb(var(--violet) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: { xl: '14px', '2xl': '20px', '3xl': '28px' },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--primary) / 0.35), 0 12px 40px -12px rgb(var(--primary) / 0.55)',
        'glow-teal': '0 0 0 1px rgb(var(--teal) / 0.35), 0 12px 40px -12px rgb(var(--teal) / 0.55)',
        card: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 20px 50px -30px rgb(0 0 0 / 0.6)',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translate3d(-3%, -2%, 0) rotate(0deg)' },
          '100%': { transform: 'translate3d(3%, 4%, 0) rotate(8deg)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        angleSpin: { to: { '--angle': '360deg' } },
        pulseDot: { '0%': { transform: 'scale(1)', opacity: '0.9' }, '100%': { transform: 'scale(2.6)', opacity: '0' } },
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite alternate',
        shimmer: 'shimmer 1.4s infinite',
        'border-spin': 'angleSpin 6s linear infinite',
        'pulse-dot': 'pulseDot 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
