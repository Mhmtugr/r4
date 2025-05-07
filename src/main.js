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

// Global API Configuration
window.DEEPSEEK_API_KEY = window.DEEPSEEK_API_KEY || 'sk-3a17ae40b3e445528bc988f04805e54b' // Demo anahtar

// Global contexts for DeepSeek - Yapay zeka modları
window.deepseekModel = {
  apiKey: window.DEEPSEEK_API_KEY,
  modelName: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 1000,
  context: {
    // Orta gerilim anahtarlama ekipmanları hakkında temel bilgiler
    technical: `
      Orta gerilim anahtarlama ekipmanları (hücreler) hakkında bilgiler:
      - RM 36 CB: Vakum kesicili hücre (Circuit Breaker), 36kV nominal gerilim, 630A-2500A nominal akım
      - RM 36 LB: Yük ayırıcılı hücre (Load Break Switch), 36kV nominal gerilim
      - RM 36 FL: Sigortalı hücre (Fused Load break), 36kV nominal gerilim
      - RM 36 RMU: Ring Main Unit, 36kV nominal gerilim
      
      Standartlar: IEC 62271-200, LSC2A-PM sınıfı, E3 ark sınıfı
      Koruma Fonksiyonları: 50/51 (aşırı akım), 50N/51N (toprak kaçağı)
    `,
    // Üretim süreçleri ve planlaması
    production: `
      Orta gerilim hücresi üretim süreçleri:
      1. Mekanik üretim: Metal gövde üretimi, bükme, kesme, kaynak işlemleri
      2. Boyahane: Toz boya uygulaması
      3. Montaj: Kesici, ayırıcı, bara montajı
      4. Elektrik montajı: Kontrol devreleri, röle bağlantıları
      5. Test: Yüksek gerilim dayanım testi, fonksiyon testleri
      
      Üretim süreleri:
      - CB hücresi: ~3-4 gün
      - LB hücresi: ~2-3 gün
      - FL hücresi: ~2 gün
      - RMU hücresi: ~4-5 gün
    `,
    // Satış ve sipariş bilgileri
    sales: `
      Müşteri segmentleri:
      - Elektrik dağıtım şirketleri (AYEDAŞ, VEDAŞ, BEDAŞ, ÇEDAŞ vb.)
      - Elektrik üretim şirketleri
      - Endüstriyel tesisler
      - Altyapı projeleri
      
      Sipariş süreci:
      1. Müşteri teknik şartnameleri incelenir
      2. Teknik şartnameye göre uygun hücre tipleri belirlenir
      3. Malzeme listeleri oluşturulur
      4. Stok kontrolü yapılır
      5. Üretim planlaması yapılır
      6. Üretim, test ve sevkiyat aşamaları gerçekleştirilir
    `
  }
};

// Demo login fonksiyonu
window.demoLogin = function(email, password) {
  console.log('Demo giriş yapılıyor...', email || 'demo@example.com');
  return {
    success: true,
    user: {
      uid: 'demo-user-001',
      email: email || 'demo@example.com',
      name: 'Demo Kullanıcı',
      role: 'admin',
      displayName: 'Demo Kullanıcı',
      photoURL: null
    },
    demo: true
  };
};

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