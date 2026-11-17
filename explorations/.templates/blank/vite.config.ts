import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Sites are served from a subpath (…/<project>/<site>/), so asset URLs
  // must be relative.
  base: './',
  plugins: [react()],
});
