<template>
  <div id="app">
    <div v-if="loading" class="app-loading">
      <div class="spinner"></div>
      <div class="brand">METS</div>
      <div class="loading-text">Yükleniyor...</div>
    </div>
    <router-view v-else />
    
    <!-- AI Chatbot Bileşenleri -->
    <AIChatbotButton v-if="isAuthenticated" />
    <AIChatModal v-if="isAIChatModalOpen" @close="closeAIChatModal" :isVisible="isAIChatModalOpen" />
    
    <!-- Toast bildirim sistemi -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <!-- Toast bildirimleri buraya eklenecek -->
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AIChatbotButton from '@/components/ai/AIChatbotButton.vue';
import AIChatModal from '@/components/ai/AIChatModal.vue';
import { useTechnicalStore } from '@/store/technical';
import { useAuthStore } from '@/store/auth';

export default {
  name: 'App',
  components: {
    AIChatbotButton,
    AIChatModal
  },
  setup() {
    const router = useRouter();
    const technicalStore = useTechnicalStore();
    const authStore = useAuthStore();
    
    // Yükleme durumu
    const loading = ref(true);
    
    // AI Chat Modal durumu
    const isAIChatModalOpen = computed(() => technicalStore.isAIChatModalOpen);
    
    // Kimlik doğrulama durumu
    const isAuthenticated = computed(() => authStore.isAuthenticated);
    
    // Modal'ı kapat
    const closeAIChatModal = () => {
      technicalStore.setAIChatModalOpen(false);
    };
    
    // Geliştirme ortamında otomatik demo giriş
    const autoDemoLogin = async () => {
      console.log('Otomatik demo giriş kontrolü yapılıyor...');
      
      // Eğer kullanıcı giriş yapmamışsa ve URL'de demo=true parametresi varsa veya geliştirme modundaysak
      if (!authStore.isAuthenticated && (window.location.search.includes('demo=true') || import.meta.env.DEV)) {
        console.log('Otomatik demo giriş başlatılıyor');
        try {
          const result = await authStore.demoLogin();
          if (result.success) {
            console.log('Otomatik demo giriş başarılı');
          } else {
            console.error('Otomatik demo giriş başarısız:', result.error);
          }
        } catch (error) {
          console.error('Otomatik demo giriş hatası:', error);
        }
      }
    };
    
    // Auth durumunu kontrol et
    onMounted(async () => {
      try {
        console.log('Auth durumu kontrol ediliyor...');
        const result = await authStore.initialize();
        
        if (result.success) {
          if (!result.isAuthenticated) {
            // Geliştirme ortamında otomatik demo giriş
            await autoDemoLogin();
          }
        }
      } catch (error) {
        console.error('Auth initialize hatası:', error);
      } finally {
        // Kimlik durumu kontrolü bittikten sonra yükleme ekranını kaldır
        // Minimum gösterme süresini garantilemek için kısa gecikme
        setTimeout(() => {
          loading.value = false;
          console.log('Uygulama yükleme tamamlandı, dashboard görüntüleniyor');
        }, 800);
      }
    });
    
    return {
      loading,
      isAuthenticated,
      isAIChatModalOpen,
      closeAIChatModal
    };
  }
};
</script>

<style lang="scss">
@forward '@/styles/main.scss';

#app {
  font-family: 'Inter', 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  z-index: 9999;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(0, 123, 255, 0.1);
    border-radius: 50%;
    border-top-color: #0d6efd;
    animation: spin 1s linear infinite;
  }
  
  .brand {
    margin-top: 20px;
    font-size: 24px;
    font-weight: 600;
    background: linear-gradient(45deg, #0d6efd, #6610f2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .loading-text {
    margin-top: 10px;
    color: #6c757d;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-color-scheme: dark) {
  .app-loading {
    background-color: #121212;
    color: #e2e2e2;
  }
}
</style>