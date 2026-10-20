import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', './messages/*.json'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        lg: '1.5rem',
        xl: '1.75rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1180px',
        '2xl': '1180px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        navy: {
          DEFAULT: 'hsl(var(--navy))',
          foreground: 'hsl(var(--navy-foreground))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        /* DataSend-style raw colors */
        surface: {
          0: '#04080f',
          1: '#070d1a',
          2: '#0a1128',
          3: '#0d1630',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(15 23 42 / 0.03), 0 6px 20px -6px rgb(15 23 42 / 0.07)',
        'elevated': '0 2px 4px -2px rgb(15 23 42 / 0.05), 0 12px 32px -12px rgb(15 23 42 / 0.12)',
        'elevated-lg': '0 4px 8px -4px rgb(15 23 42 / 0.08), 0 20px 50px -20px rgb(15 23 42 / 0.18)',
        'elevated-xl': '0 24px 48px rgba(0, 0, 0, 0.6)',
        'glow': 'var(--glow-primary)',
        'glow-accent': 'var(--glow-accent)',
        'glow-sm': 'var(--glow-sm)',
        'glow-blue': '0 8px 24px rgba(59, 130, 246, 0.4)',
        'glass': 'var(--shadow-glass)',
        'inner-glow': 'inset 0 1px 2px 0 hsl(var(--primary) / 0.1)',
      },
      fontFamily: {
        sans: ['var(--font-english)', 'var(--font-arabic)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-english)', 'var(--font-arabic)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
        brand: ['var(--font-brand)', 'var(--font-arabic)', 'system-ui', 'sans-serif'],
        nexora: ['var(--font-nexora)', 'var(--font-arabic)', 'var(--font-brand)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'var(--font-arabic)', 'monospace'],
      },
      fontSize: {
        'display': ['clamp(28px, 5vw, 56px)', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '800' }],
        'heading-1': ['clamp(22px, 3.5vw, 36px)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading-2': ['clamp(18px, 2.5vw, 24px)', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '600' }],
        'heading-3': ['clamp(16px, 2vw, 20px)', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.6', letterSpacing: '-0.015em' }],
        'body-lg': ['15px', { lineHeight: '1.6', letterSpacing: '-0.015em' }],
        'small': ['12px', { lineHeight: '1.5', letterSpacing: '0' }],
        'label': ['11px', { lineHeight: '1.4', letterSpacing: '0.03em', fontWeight: '600' }],
        'mono': ['12px', { lineHeight: '1.6', letterSpacing: '0.02em' }],
      },
      minHeight: {
        tap: '44px',
      },
      minWidth: {
        tap: '44px',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-bottom': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'accordion-down': {
          from: { height: '0', opacity: '0' },
          to: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          to: { height: '0', opacity: '0' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'shimmer-text': {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'glow': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.65' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(2deg)' },
          '66%': { transform: 'translateY(10px) rotate(-1deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.2)' },
          '50%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.4)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '50%, 100%': { transform: 'translateX(100%)' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'border-beam': {
          '100%': { offsetDistance: '100%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.75s ease forwards',
        'fade-up': 'fade-up 0.75s cubic-bezier(.16, 1, .3, 1) forwards',
        'fade-in-scale': 'fade-in-scale 0.4s ease-out',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'shimmer-text': 'shimmer-text 5s linear infinite',
        'glow': 'glow 6s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'ticker': 'ticker 50s linear infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        'border-beam': 'border-beam 2.5s linear infinite',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'var(--gradient-mesh)',
        'hero-gradient': 'var(--gradient-hero)',
        'brand-gradient': 'var(--gradient-brand)',
        'shimmer-gradient': 'var(--gradient-shimmer)',
      },
    },
  },
  plugins: [],
};

export default config;