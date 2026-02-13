// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://spud-ai.github.io', // We can update this to the funnel URL later
  base: '/daily-spud',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
});
