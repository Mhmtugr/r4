<template>
  <div class="app-container">
    <app-header />
    <div class="content-container">
      <sidebar v-if="showSidebar" />
      <main class="main-content">
        <router-view />
      </main>
    </div>
    <app-footer />
    <notifications />
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import AppHeader from './AppHeader.vue';
import Sidebar from './Sidebar.vue';
import AppFooter from './AppFooter.vue';
import Notifications from '@/components/ui/Notifications.vue';

// State
const router = useRouter();
const authStore = useAuthStore();
const showSidebar = ref(true);

// Provide/inject için servisleri sağla
provide('toggleSidebar', () => {
  showSidebar.value = !showSidebar.value;
});

onMounted(async () => {
  // Kullanıcı oturum durumunu kontrol et
  await authStore.checkAuthState();
  
  // Oturum yoksa giriş sayfasına yönlendir
  if (!authStore.isAuthenticated && router.currentRoute.value.meta.requiresAuth) {
    router.push({ name: 'login' });
  }
});
</script>

<style lang="scss">
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-container {
  display: flex;
  flex: 1;
}

.main-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .content-container {
    flex-direction: column;
  }
}
</style>