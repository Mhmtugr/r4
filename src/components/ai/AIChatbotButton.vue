<template>
  <div class="ai-chatbot">
    <div class="ai-chatbot-btn" @click="openChatModal">
      <i class="bi bi-robot"></i>
      <span v-if="unreadNotifications > 0" class="notification-badge">{{ unreadNotifications }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/store/notification'
import { useTechnicalStore } from '@/store/technical'

// Bildirimler için store
const notificationStore = useNotificationStore()
const technicalStore = useTechnicalStore()
const unreadNotifications = ref(0)

// Bildirim sayısını güncelle
const updateNotificationCount = () => {
  // Gerçek uygulamada burada notificationStore'dan alınacak
  unreadNotifications.value = notificationStore.getUnreadCount || Math.floor(Math.random() * 5)
}

// Chat modali aç
const openChatModal = () => {
  technicalStore.setAIChatModalOpen(true)
  unreadNotifications.value = 0 // Bildirimleri temizle
}

onMounted(() => {
  updateNotificationCount()
  
  // Demo için bildirim sayısını periyodik olarak güncelle
  setInterval(() => {
    // Gerçek uygulamada gerekli olmayacak
    if (!technicalStore.isAIChatModalOpen) {
      updateNotificationCount()
    }
  }, 60000) // 1 dakikada bir
})
</script>

<style scoped>
.ai-chatbot {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.ai-chatbot-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--primary-color, #0d6efd);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s;
}

.ai-chatbot-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: var(--danger-color, #dc3545);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>