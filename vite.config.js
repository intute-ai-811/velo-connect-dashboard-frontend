import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Drop console.* and debugger in production via esbuild (built-in, no extra install)
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },

  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    minify: 'esbuild',
    // No source maps in production — don't expose source code to the public
    sourcemap: mode !== 'production',
    // Warn when a single chunk exceeds 600 kB
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split heavy deps into separately cached chunks
        manualChunks: {
          react:  ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          map:    ['leaflet', 'react-leaflet'],
          icons:  ['lucide-react'],
          http:   ['axios'],
        },
      },
    },
  },
}));
