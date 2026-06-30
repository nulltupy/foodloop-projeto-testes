import type { Config } from 'tailwindcss';

// ── FoodLoop · "Hortelã" ─────────────────────────────────────────────────
// Mercado fresco: fundo branco-menta, verde-folha saturado, laranja-cítrico
// como acento, e o desconto como herói (selo redondo). Legível e amigável,
// cara de quitanda moderna — não de SaaS.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Uma família só, com contraste forte de peso (Hanken vai de 400 a 800).
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Verde-folha: marca, ações primárias, estados "salvo/pronto".
        leaf: {
          DEFAULT: '#0a7d52',
          dark: '#0a6344',
          deep: '#08502f',
          50: '#eef7f1',
          100: '#d6ebdf',
          200: '#a9d6bd',
        },
        // Laranja-cítrico: o desconto/economia e a urgência.
        citrus: {
          DEFAULT: '#ff7a1a',
          dark: '#e85f00',
          50: '#fff2e6',
        },
        // Tinta verde-quase-preta para texto.
        ink: {
          DEFAULT: '#14241a',
          soft: '#45564c',
          mute: '#7c8a82',
        },
        // Superfícies.
        canvas: {
          DEFAULT: '#f4f8f5',
          card: '#ffffff',
          line: '#e5ece8',
        },
        danger: {
          DEFAULT: '#e23b2e',
          dark: '#c22a1e',
          50: '#fdecea',
        },
        amber: { DEFAULT: '#f5a623', 50: '#fef5e3' },
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '12px',
        lg: '14px',
        xl: '18px',
        '2xl': '22px',
        '3xl': '28px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 12px 30px -16px rgba(20,40,28,0.22), 0 2px 6px -2px rgba(20,40,28,0.06)',
        soft: '0 2px 10px -3px rgba(20,40,28,0.14)',
        pop: '0 16px 34px -14px rgba(10,125,82,0.40)',
        badge: '0 8px 16px -5px rgba(255,122,26,0.55)',
        sheet: '0 -20px 50px -20px rgba(20,40,28,0.35)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(9px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        // Ease-out exponencial, sem bounce.
        rise: 'rise 0.4s cubic-bezier(0.22,1,0.36,1) both',
        pop: 'pop 0.32s cubic-bezier(0.22,1,0.36,1) both',
        sheet: 'sheetUp 0.34s cubic-bezier(0.22,1,0.36,1) both',
        fade: 'fade 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
