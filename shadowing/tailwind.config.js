/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-bg': "url('/background.jpg')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        primary: "#fc5d01",
        primaryHover: "#fd7f33",
        background: "#ffffff",
        lightBackground: "#fedac2",
        borderLight: "#fdbc94",
        appBg: {
          deep1: "#070910",
          deep2: "#0b1220",
          deep3: "#141a2b",
        },
        glass: {
          base: "rgba(255,255,255,0.1)",
          strong: "rgba(255,255,255,0.14)",
          border: "rgba(255,255,255,0.18)",
        },
        textGlass: {
          primary: "rgba(255,255,255,0.9)",
          secondary: "rgba(255,255,255,0.7)",
          muted: "rgba(255,255,255,0.55)",
        },
      },
      borderRadius: {
        card: "22px",
        btn: "17px",
      },
      backdropBlur: {
        glass: "20px",
      },
      boxShadow: {
        glass:
          "0 20px 50px -26px rgba(0,0,0,0.85), 0 10px 24px -16px rgba(0,0,0,0.55)",
        glassStrong:
          "0 24px 56px -26px rgba(0,0,0,0.9), 0 14px 30px -18px rgba(0,0,0,0.65)",
        accentGlow: "0 0 0 1px rgba(252,93,1,0.35), 0 0 22px rgba(252,93,1,0.35)",
      },
    },
  },
  plugins: [],
}
