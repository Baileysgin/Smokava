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
      // Use process.env.VITE_API_URL if available (Docker build), otherwise use env from loadEnv
      'import.meta.env.VITE_API_URL': JSON.stringify(
        process.env.VITE_API_URL || env.VITE_API_URL || 'https://api.smokava.com/api'
      ),
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
          // Manual chunk splitting - ensure React loads FIRST
          // Put ALL node_modules in react-vendor except truly independent utils
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Put ALL React and React-dependent packages in react-vendor
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router') ||
                id.includes('scheduler') ||
                id.includes('antd') ||
                id.includes('rc-') ||
                id.includes('recharts') ||
                id.includes('@ant-design') ||
                id.includes('@rc-') ||
                id.includes('@babel') ||
                id.includes('@emotion') ||
                id.includes('@mui') ||
                id.includes('clsx') ||
                id.includes('classnames')
              ) {
                return 'react-vendor';
              }
              // Only truly independent utilities in separate chunks
              if (id.includes('axios')) {
                return 'utils';
              }
              if (id.includes('zustand')) {
                return 'utils';
              }
              if (id.includes('dayjs')) {
                return 'utils';
              }
              // Everything else - put in react-vendor to be safe
              // This ensures no code tries to access React before it's loaded
              return 'react-vendor';
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
