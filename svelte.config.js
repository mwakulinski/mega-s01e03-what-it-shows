import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';

const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

// The kb as the desk sees it: .svx pages with the runbook layout, prerendered to static HTML in desk-view/.
export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [mdsvex({ extensions: ['.svx'], layout: { runbook } })],
  kit: {
    adapter: adapter({ pages: 'desk-view', assets: 'desk-view', strict: false }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['/kb', '/kb/incidents/4471-what-it-holds'], handleHttpError: 'warn' },
  },
};
