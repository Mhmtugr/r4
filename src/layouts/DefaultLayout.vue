<template>
  <div class="app-container" :class="{ 'sidebar-collapsed': isSidebarCollapsed, 'dark-mode': isDarkMode }">
    <AppSidebar :is-collapsed="isSidebarCollapsed" />
    <div class="main-content">
      <AppHeader 
        :username="username" 
        @toggle-sidebar="toggleSidebar" 
        @logout="handleLogout"
        @toggle-dark-mode="toggleDarkMode"
      />
      <main class="content">
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <Suspense>
                <component :is="Component" />
                <template #fallback>
                  <div class="loading-component">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Yükleniyor...</span>
                    </div>
                  </div>
                </template>
              </Suspense>
            </transition>
          </router-view>
        </div>
      </main>
      <AppFooter />
    </div>
    <AIChatbotButton v-if="isAuthenticated" />
    <AIChatModal v-if="isAIChatModalOpen" @close="closeAIChatModal" :isVisible="isAIChatModalOpen" />
    <Notifications />
  </div>
</template>

<script setup>
import { ref, provide, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/store/auth';
import { useTechnicalStore } from '@/store/technical';
import AppHeader from '@/components/app/AppHeader.vue';
import AppSidebar from '@/components/app/AppSidebar.vue';
import AppFooter from '@/components/app/AppFooter.vue';
import Notifications from '@/components/ui/Notifications.vue';
import AIChatbotButton from '@/components/ai/AIChatbotButton.vue';
import AIChatModal from '@/components/ai/AIChatModal.vue';

// Router ve store
const router = useRouter();
const authStore = useAuthStore();
const technicalStore = useTechnicalStore();

// Reactive store properties - storeToRefs kullanarak
const { user, isAuthenticated } = storeToRefs(authStore);
const { isAIChatModalOpen } = storeToRefs(technicalStore);

// Username
const username = computed(() => {
  return user.value?.displayName || user.value?.name || 'Kullanıcı';
});

// Dark mode state
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');

// Sidebar durumu
const isSidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true');

// Modal'ı kapat
const closeAIChatModal = () => {
  technicalStore.setAIChatModalOpen(false);
};

// Toggle fonksiyonları
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.value);
};

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
  document.body.classList.toggle('dark-mode', isDarkMode.value);
  
  // Dark mode değişikliği olayı yayınla
  const event = new CustomEvent('dark-mode-toggle', { 
    detail: { isDarkMode: isDarkMode.value } 
  });
  document.dispatchEvent(event);
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push({ name: 'Login' });
  } catch (error) {
    console.error('Çıkış yapılırken hata:', error);
  }
};

// Provide ile alt bileşenlere aktarılması
provide('isSidebarCollapsed', isSidebarCollapsed);
provide('toggleSidebar', toggleSidebar);
provide('isDarkMode', isDarkMode);
provide('toggleDarkMode', toggleDarkMode);

// Sayfa yüklendiğinde dark mode durumunu kontrol et
onMounted(() => {
  // Sayfa yüklenirken dark mode ayarı
  document.body.classList.toggle('dark-mode', isDarkMode.value);
  
  // Auth durumunu kontrol et, değilse ve development modunda ise otomatik login
  if (!isAuthenticated.value) {
    console.log('Otomatik giriş kontrolü yapılıyor...');
    
    // Demo modu veya URL'de demo parametresi varsa
    if (window.location.search.includes('demo=true') || import.meta.env.DEV) {
      console.log('Development ortamında otomatik giriş yapılıyor...');
      authStore.demoLogin().catch(error => {
        console.error('Otomatik giriş başarısız:', error);
      });
    }
  }
});

// Route değişiklikleri izleme - mobil görünümde sidebar otomatik kapansın
watch(
  () => router.currentRoute.value.path,
  () => {
    if (window.innerWidth < 992 && !isSidebarCollapsed.value) {
      isSidebarCollapsed.value = true;
    }
  }
);
</script>

<style lang="scss">
// Define variables locally instead of importing them to avoid build issues
$sidebar-width: 250px;
$sidebar-collapsed-width: 70px;

.app-container {
  display: flex;
  min-height: 100vh;
  overflow: hidden;
  background-color: var(--bg-content, #f5f7fa);
  
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: calc(100% - #{$sidebar-width}); /* Explicit width calculation */
    margin-left: $sidebar-width;
    transition: margin-left 0.3s ease, width 0.3s ease;
    min-height: 100vh;
    padding: 0;
    
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
      
      .content-wrapper {
        flex: 1;
        padding: 1.5rem;
        width: 100%; /* Ensure full width content */
      }
    }
  }

  &.sidebar-collapsed {
    .main-content {
      margin-left: $sidebar-collapsed-width;
      width: calc(100% - #{$sidebar-collapsed-width}); /* Update width when collapsed */
    }
  }
}

/* Bileşen yükleme ekranı */
.loading-component {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
}

/* Sayfa geçişi animasyonu */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Duyarlı tasarım ayarları */
@media (max-width: 992px) {
  .app-container {
    .main-content {
      margin-left: 0 !important;
      width: 100% !important; /* Full width on mobile */
    }
  }
  
  .app-container:not(.sidebar-collapsed) .main-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1029;
  }
}

/* Dark mode özellikleri */
.dark-mode {
  --bg-content: #121212;
  --text-color: #e2e2e2;
  --border-color: rgba(255, 255, 255, 0.1);
  --bg-card: #1e1e1e;
  --text-muted: #a7a7a7;
  
  .card {
    background-color: var(--bg-card);
    border-color: var(--border-color);
  }
  
  .card-header {
    background-color: var(--bg-card);
    border-color: var(--border-color);
  }
  
  .table {
    color: var(--text-color);
  }
  
  .custom-table th {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .loading-component {
    color: var(--text-color);
  }
}
</style>