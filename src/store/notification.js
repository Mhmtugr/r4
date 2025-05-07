/**
 * Notification Store
 * Bildirim sistemi için Pinia store
 */
import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    maxCount: 50,
  }),

  getters: {
    /**
     * Okunmamış bildirim sayısı
     */
    unreadCount: (state) => {
      return state.notifications.filter(notification => !notification.read).length;
    },
    
    /**
     * Son 5 bildirim
     */
    recentNotifications: (state) => {
      return state.notifications.slice(0, 5);
    }
  },

  actions: {
    /**
     * Yeni bildirim ekle
     * @param {Object} notification - Bildirim nesnesi
     * @param {string} notification.title - Bildirim başlığı
     * @param {string} notification.message - Bildirim mesajı
     * @param {string} notification.type - Bildirim türü (success, info, warning, danger)
     * @param {Date} notification.timestamp - Bildirim zamanı
     * @param {string} notification.link - Bildirim tıklandığında açılacak sayfa
     * @param {boolean} notification.read - Okundu durumu
     */
    add(notification) {
      // Benzersiz ID oluştur
      const id = Date.now().toString();
      
      // Varsayılan değerleri birleştir
      const newNotification = {
        id,
        read: false,
        timestamp: new Date(),
        type: 'info',
        ...notification
      };
      
      // Bildirimi listenin başına ekle
      this.notifications.unshift(newNotification);
      
      // Maximum sayıyı aşıyorsa en eski bildirimleri sil
      if (this.notifications.length > this.maxCount) {
        this.notifications = this.notifications.slice(0, this.maxCount);
      }
      
      return newNotification;
    },
    
    /**
     * Bildirim oku
     * @param {string} id - Bildirim ID
     */
    read(id) {
      const notification = this.notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    },
    
    /**
     * Bildirim sil
     * @param {string} id - Bildirim ID
     */
    remove(id) {
      this.notifications = this.notifications.filter(n => n.id !== id);
    },
    
    /**
     * Tüm bildirimleri okundu olarak işaretle
     */
    markAllAsRead() {
      this.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    /**
     * Tüm bildirimleri temizle
     */
    clearAll() {
      this.notifications = [];
    },
    
    /**
     * Birden fazla bildirim ekle (genellikle demo veya test için)
     * @param {Array} notifications - Bildirim dizisi
     */
    addBulk(notifications) {
      notifications.forEach(notification => {
        this.add(notification);
      });
    }
  },
  
  // Bildirimler local storage'da saklanabilir (opsiyonel)
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'mets-notifications',
        storage: localStorage,
      },
    ],
  }
});