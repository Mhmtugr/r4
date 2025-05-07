<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

// Layout bileşenleri - lazy loaded
const DefaultLayout = () => import('./layouts/DefaultLayout.vue')
const BlankLayout = () => import('./layouts/BlankLayout.vue')

const route = useRoute()
const authStore = useAuthStore()

// Layout seçimi
const layoutComponent = computed(() => {
  const layout = route.meta.layout || 'default'
  return layout === 'blank' ? BlankLayout : DefaultLayout
})

// onMounted içinde oturum kontrolü
onMounted(async () => {
  if (!authStore.sessionInitialized) {
    await authStore.initialize();
    console.log('App.vue: Auth store initialized, session status:', authStore.isAuthenticated);
  }
});
</script>

<style lang="scss">
@use "./styles/main.scss";

/* Ana stiller */
html, body {
  min-height: 100vh;
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  color: var(--text-primary, #333);
  scroll-behavior: smooth;
}

body {
  background-color: var(--bg-content);
}

// Global yardımcı stiller
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cursor-pointer {
  cursor: pointer;
}

.bg-image-cover {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

// Material status özellikleri
.material-required {
  background-color: var(--material-required-bg);
}

.material-available {
  background-color: var(--material-available-bg);
}

.material-critical {
  background-color: var(--material-critical-bg);
}

// Özel scrollbar stili
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

// Dark mode scrollbar
.dark-mode {
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
</style>