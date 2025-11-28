import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'

  return {
    plugins: [
      react(),
      // Gzip compression
      isProduction && viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Only compress files > 1KB
      }),
      // Brotli compression
      isProduction && viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
      }),
      // Bundle analyzer (optional, can be removed)
      // isProduction && visualizer({ open: false, filename: 'dist/stats.html' }),
    ].filter(Boolean),
    define: {
      // Make VITE_ prefixed env vars available in the app
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
    },
    build: {
      // Enable minification (esbuild is faster than terser)
      minify: 'esbuild',
      // Remove console.log in production
      drop: isProduction ? ['console', 'debugger'] : [],
      // Generate source maps only in development
      sourcemap: !isProduction,
      // Code splitting and chunk optimization
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: (id) => {
            // Vendor chunks - order matters for dependency resolution
            if (id.includes('node_modules')) {
              // All React-related packages must be in react-vendor to ensure React loads first
              // This includes React, React DOM, React Router, and any React-dependent utilities
              if (
                id.includes('react') ||
                id.includes('react-router') ||
                id.includes('react-dom') ||
                id.includes('scheduler')
              ) {
                return 'react-vendor';
              }
              // Antd can be separate but depends on React (will load after react-vendor)
              if (id.includes('antd')) {
                return 'antd';
              }
              // Charts (depends on React, will load after react-vendor)
              if (id.includes('recharts')) {
                return 'charts';
              }
              // Utils (no React dependency)
              if (id.includes('axios') || id.includes('zustand') || id.includes('dayjs')) {
                return 'utils';
              }
              // Other node_modules (must not depend on React)
              return 'vendor';
            }
          },
          // Optimize chunk file names
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[ext]/[name]-[hash][extname]`;
          },
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable CSS code splitting
      cssCodeSplit: true,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'antd'],
    },
  }
})
