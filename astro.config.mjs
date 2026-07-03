// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist Sans',
      cssVariable: '--font-geist-sans',
      options: {
        variants: [
          {
            weight: '100 900',
            style: 'normal',
            src: ['./node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2'],
          },
        ],
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});