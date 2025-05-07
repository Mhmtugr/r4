import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import * as sass from 'sass';

// Mutlak dosya yolunu belirle
const resolveAbsolutePath = (p) => path.resolve(__dirname, p);

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'assets/**/*'],
      // PWA manifestini etkinleştir ve public klasöründeki dosyayı kullan
      manifest: {
        name: "MehmetEndustriyelTakip",
        short_name: "ElektroTrack",
        description: "Orta Gerilim Hücre İmalat Takip Sistemi",
        theme_color: "#1e40af",
        background_color: "#f8fafc",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: 'assets/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'assets/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'assets/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
        shortcuts: [
          { name: "Kontrol Paneli", short_name: "Dashboard", description: "Kontrol paneline git", url: "/dashboard", icons: [{ src: "assets/icons/shortcuts/dashboard.png", sizes: "96x96" }] },
          { name: "Siparişler", short_name: "Siparişler", description: "Siparişlere git", url: "/orders", icons: [{ src: "assets/icons/shortcuts/orders.png", sizes: "96x96" }] },
          { name: "Üretim", short_name: "Üretim", description: "Üretim sayfasına git", url: "/production", icons: [{ src: "assets/icons/shortcuts/production.png", sizes: "96x96" }] }
        ],
        categories: ["business", "productivity", "utilities"],
        lang: "tr-TR",
        dir: "ltr"
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: ['**/node_modules/**/*', '**/unused/**/*', '**/dist/**'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 günlük cache
              }
            }
          }
        ],
        // Service worker yapılandırması
        swDest: 'dist/sw.js',
        navigateFallback: '/offline.html',
        additionalManifestEntries: [
          { url: 'offline.html', revision: null }
        ],
        skipWaiting: true,
        clientsClaim: true
      },
      injectManifest: false,
      selfDestroying: false,
      strategies: 'generateSW',
      buildBase: '/',
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
  base: './', // Base URL'i kök dizin olarak ayarla
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production', // Sadece geliştirme ortamında sourcemap
    minify: 'terser',
    assetsInlineLimit: 4096, // 4KB'den küçük dosyaları inline et
    chunkSizeWarningLimit: 1500, // Chunk boyutu uyarı limitini artır
    rollupOptions: {
      input: resolveAbsolutePath('index.html'),
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-chart': ['chart.js'],
          'vendor-bootstrap': ['bootstrap'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
      external: []
    },
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    // Build hatalarını daha net görüntülemek için
    reportCompressedSize: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'vue': 'vue/dist/vue.esm-bundler.js',
      // Hatalı dosya yollarını önlemek için ekstra alias'lar
      '@views': resolveAbsolutePath('src/modules'),
      '@components': resolveAbsolutePath('src/components'),
      '@modules': resolveAbsolutePath('src/modules'),
      '@services': resolveAbsolutePath('src/services'),
      '@utils': resolveAbsolutePath('src/utils'),
      '@styles': resolveAbsolutePath('src/styles'),
      '@assets': resolveAbsolutePath('src/assets'),
      '@store': resolveAbsolutePath('src/store'),
      '@composables': resolveAbsolutePath('src/composables'),
      '@config': resolveAbsolutePath('src/config')
    },
    // Modül çözümleme sorunlarını önlemek için
    dedupe: ['vue'],
    // Import sorunlarını önlemek için uzantı çözümlemesi
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  optimizeDeps: {
    include: [
      'vue', 
      'vue-router', 
      'pinia', 
      'axios', 
      'mitt', 
      'chart.js',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'bootstrap/dist/js/bootstrap.bundle.min.js'
    ],
    exclude: []
  },
  server: {
    port: 3000,
    open: true,
    // IDE hata ayıklama için kaynak haritalarını etkinleştir
    cors: true,
    hmr: {
      overlay: true
    }
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        // Modern SASS API'lerini zorunlu kılma
        implementation: sass,
        sassOptions: {
          outputStyle: 'compressed',
          charset: false,
          // Uyarıları bastır ve hata mesajları gösterme
          quietDeps: true,
          quiet: true,
          // Uyarıları hataya dönüştürmeyi engelleme
          strict: false,
          // İçe aktarma çözümlemesini iyileştirme
          loadPaths: [
            resolveAbsolutePath('src/styles'),
            resolveAbsolutePath('src'),
            resolveAbsolutePath('node_modules')
          ],
          // Legacy API kullanımını bastır
          legacyWarning: false,
          // SASS 2.0 uyumluluğunu zorunlu kılma
          futureWarning: false
        },
        warnWhenUsingLegacyJsAPI: false // Legacy JS API uyarılarını kapatır
      }
    }
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
    // Kod içindeki hataları yakalamak için
    keepNames: true
  }
});