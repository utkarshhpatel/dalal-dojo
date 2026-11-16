/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          subtle: 'var(--bg-subtle)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
          input: 'var(--bg-input)',
        },
        border: {
          DEFAULT: 'var(--border-subtle)',
          subtle: 'var(--border-subtle)',
          focus: 'var(--border-focus)',
        },
        main: 'var(--text-main)',
        heading: 'var(--text-heading)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          text: 'var(--color-primary-text)',
        },
        accent: 'var(--color-accent)',
        gain: {
          DEFAULT: 'var(--color-gain)',
          subtle: 'var(--color-gain-subtle)',
        },
        loss: {
          DEFAULT: 'var(--color-loss)',
          subtle: 'var(--color-loss-subtle)',
        },
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        input: '8px',
      },
      fontSize: {
        '2xs': ['11px', '14px'],
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['28px', '36px'],
        '2xl': ['36px', '44px'],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
};
