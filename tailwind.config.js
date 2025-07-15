import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui], // ✅ Register the DaisyUI plugin
  daisyui: {
    themes: ["light", "dark", "cupcake", "bumblebee"], // ✅ DaisyUI config inside export
  },
};
