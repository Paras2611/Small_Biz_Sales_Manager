/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-navy': 'var(--color-brand-navy)',
        'brand-blue': 'var(--color-brand-blue)',
        'brand-accent': 'var(--color-brand-accent)',
        'surface-0': 'var(--color-surface-0)',
        'surface-1': 'var(--color-surface-1)',
        'surface-2': 'var(--color-surface-2)',
        'border-token': 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'status-new': 'var(--color-status-new)',
        'status-qualified': 'var(--color-status-qualified)',
        'status-disqualified': 'var(--color-status-disqualified)',
        'status-won': 'var(--color-status-won)',
        'status-lost': 'var(--color-status-lost)',
        'priority-high': 'var(--color-priority-high)',
        'priority-medium': 'var(--color-priority-medium)',
        'priority-low': 'var(--color-priority-low)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        input: '6px',
        badge: '6px',
      }
    },
  },
  plugins: [],
}
