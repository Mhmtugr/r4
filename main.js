/**
 * METS - MehmetEndüstriyelTakip Ana Uygulama Giriş Noktası
 * Version: 2.0.0
 * Author: MehmetMETS Team
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'

// Styles
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/styles/main.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Utils and Config
import { aiService } from '@/services/ai-service'
import { apiService } from '@/services/api-service'
import { useEventBus } from '@/utils/event-bus'
import { registerComponents } from '@/utils/component-registrar'

// Service Worker Kaydı (ornekindex.html'den taşındı)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // NOTE: service-worker.js yolunun build sonrası doğru olduğundan emin olun.
    // Vite genellikle bunu kök dizine koyar. Gerekirse yolu ayarlayın.
    navigator.serviceWorker.register('/service-worker.js') // '/service-worker.js' veya import.meta.env.BASE_URL + 'service-worker.js'
      .then(registration => {
        console.log('Service Worker başarıyla kaydedildi:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker kaydı başarısız:', error);
      });
  });
}

// Oluştur ve ayarla
const app = createApp(App)

// Pinia store
const pinia = createPinia()
app.use(pinia)

// Router kullan
app.use(router)

// Bileşen kaydedici
registerComponents(app)

// Global özellikleri ayarla
app.config.globalProperties.$eventBus = useEventBus()
app.config.globalProperties.$apiService = apiService
app.config.globalProperties.$aiService = aiService

// Geliştirme sırasında faydalı konsol mesajları
if (import.meta.env.DEV) {
  console.log('🚀 MehmetEndüstriyelTakip - Geliştirme Modu')
  console.log('🔌 API URL:', import.meta.env.VITE_API_URL || 'Not configured')
  console.log('📊 Version:', import.meta.env.VITE_APP_VERSION || '1.0.0')
  
  // Daha temiz bir Development deneyimi için konsol grupları kullan
  console.groupCollapsed('🛠️ Geliştirme Bilgileri')
  console.log('Pinia Store:', pinia)
  console.log('Router:', router)
  console.log('Environment:', import.meta.env)
  console.groupEnd()
}

// Uygulama Error Handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global Error:', err)
  console.error('Error Component:', vm)
  console.error('Error Info:', info)
  
  // Gerçek bir uygulamada bir hata izleme servisine bildirimde bulunulabilir (Sentry vb.)
}

// Mount et
app.mount('#app')