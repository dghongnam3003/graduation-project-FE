/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        'inria': ['Inria Sans', 'sans-serif'],
      },
      keyframes: {
        'slide-down': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-10px) scale(0.95)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          }
        },
        'slide-up': {
          '0%': { 
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
          '100%': { 
            opacity: '0',
            transform: 'translateY(-10px) scale(0.95)',
          }
        }
      },
      animation: {
        'slide-up': 'slide-up 0.1s ease-out',
        'slide-down': 'slide-down 0.2s ease-out'
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require("tailwindcss-animate"),
    require("daisyui")
  ],
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#10b981",
          "secondary": "#047857",
          "accent": "#0e9f6e",
          "neutral": "#333c4d",
          "base-100": "#0a0a0a",
          "base-content": "#ededed",
        },
      },
    ],
  },
} satisfies Config;