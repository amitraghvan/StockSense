import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        nav: 'var(--nav)',
        'nav-foreground': 'var(--nav-foreground)',
        link: 'var(--link)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
        },
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        info: {
          DEFAULT: 'var(--info)',
          bg: 'var(--info-bg)',
        },
        danger: {
          DEFAULT: 'var(--destructive)',
          bg: 'var(--danger-bg)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.006em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.011em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.014em' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.017em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.019em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.021em' }],
      },
    },
  },
  plugins: [],
};

export default config;
