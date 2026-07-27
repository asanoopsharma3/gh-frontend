/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
   extend: {
  keyframes: {
    fadeIn: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    },
     
    glowSlide: {
      "0%, 100%": { borderColor: "#f87171" },
      "25%": { borderColor: "#facc15" },
      "50%": { borderColor: "#60a5fa" },
      "75%": { borderColor: "#a78bfa" },
    },
    slideIn: {
      '0%': { transform: 'translateY(-20px)', opacity: 0 },
      '100%': { transform: 'translateY(0)', opacity: 1 },
    },
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  },
  animation: {
    fadeIn: 'fadeIn 0.3s ease-out',
    slideIn: 'slideIn 0.3s ease-out',
    spin: 'spin 0.5s linear',
    
    glowSlide: "glowSlide 5s linear infinite",
  },
},

  },
  plugins: [],
};
