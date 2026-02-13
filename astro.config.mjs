// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // site will be set once we have a proper domain
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
});
