/**
 * Global bileşen kaydı için yardımcı fonksiyon
 * Sık kullanılan bileşenler burada global olarak kaydedilir
 */
import { defineAsyncComponent } from 'vue';

// UI bileşenleri
import Notifications from '@/components/ui/Notifications.vue';

// Yüklenme göstergeleri
const AsyncLoading = {
  template: `
    <div class="d-flex justify-content-center align-items-center p-3">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Yükleniyor...</span>
      </div>
    </div>
  `
};

const AsyncError = {
  template: `
    <div class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i> Bileşen yüklenirken hata oluştu.
    </div>
  `,
  props: ['error']
};

export function registerComponents(app) {
  try {
    console.log('Global bileşenler kaydediliyor...');
    
    // Temel UI bileşenleri
    app.component('Notifications', Notifications);
    
    // AI bileşenleri - güvenli bir şekilde async yükleme
    app.component('AIChatbotButton', defineAsyncComponent({
      loader: () => import('@/components/ai/AIChatbotButton.vue')
        .catch(err => {
          console.error('AIChatbotButton yüklenirken hata:', err);
          return AsyncError;
        }),
      loadingComponent: AsyncLoading,
      errorComponent: AsyncError
    }));
    
    console.log('Global bileşenler kaydı tamamlandı');
  } catch (error) {
    console.error('Bileşen kaydı sırasında hata:', error);
  }
}