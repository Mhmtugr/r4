import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useErpService } from '@/services/erp-service';

/**
 * Bildirim ve uyarı yönetimi için Pinia store
 */
export const useNotificationStore = defineStore('notification', () => {
  const erpService = useErpService();
  // Notifikasyon listesi
  const notifications = ref([]);
  const unreadCount = ref(0);
  const lastCheck = ref(null);

  // Okunmamış bildirimleri filtreleme
  const unreadNotifications = computed(() => {
    return notifications.value.filter(notification => !notification.isRead);
  });

  // Önemli bildirimleri filtreleme
  const importantNotifications = computed(() => {
    return notifications.value.filter(notification => notification.priority === 'high' || notification.priority === 'medium');
  });
  
  // Bildirimleri önceliğe göre sıralama
  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => {
      // Öncelikle önceliğe göre sırala
      const priorities = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorities[b.priority] - priorities[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Aynı öncelikte ise tarihe göre sırala (yeniden eskiye)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  });

  /**
   * Bildirimleri sunucudan yükle
   */
  async function fetchNotifications() {
    try {
      // Bildirimleri API'den alma simülasyonu
      const response = await erpService.getNotifications();
      if (response && response.success) {
        const newNotifications = response.data.map(notification => ({
          ...notification,
          formattedTime: formatTimeAgo(notification.timestamp)
        }));
        
        // Yeni gelen bildirimler arasında okunmamış olanları bul
        const newUnreadCount = newNotifications.filter(n => !n.isRead).length;
        
        // Bildirimleri güncelle
        notifications.value = newNotifications;
        unreadCount.value = newUnreadCount;
      }
      lastCheck.value = new Date();
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
      return [];
    }
  }

  /**
   * Zaman damgasını "X süre önce" formatına dönüştür
   * @param {string|Date} timestamp - Tarih zaman damgası
   * @returns {string} Formatlanmış zaman mesajı
   */
  function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    } catch (err) {
      console.error('Tarih biçimlendirme hatası:', err);
      return '';
    }
  }

  /**
   * Demo bildirimleri yükle (Gerçek veri yoksa)
   */
  function loadDemoNotifications() {
    const now = new Date();
    
    const demoNotifications = [
      {
        id: 1,
        title: 'Sipariş Teslim Tarihi Gecikmesi',
        content: '#0424-1251 numaralı sipariş için mekanik montaj gecikmesi.',
        department: 'Mekanik Üretim',
        priority: 'high',
        type: 'warning',
        isRead: false,
        timestamp: new Date(now.getTime() - 60 * 60 * 1000) // 1 saat önce
      },
      {
        id: 2,
        title: 'Kritik Malzeme Stok Uyarısı',
        content: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC stok seviyesi kritik.',
        department: 'Satın Alma',
        priority: 'medium',
        type: 'warning',
        isRead: false,
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 saat önce
      },
      {
        id: 3,
        title: 'Yeni Sipariş Alındı',
        content: 'KEE Enerji firması için 12 adet RM 36 CB hücresi siparişi oluşturuldu.',
        department: 'Satış',
        priority: 'low',
        type: 'info',
        isRead: true,
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000) // 5 saat önce
      },
      {
        id: 4,
        title: 'Test Sonuçları Onayı',
        content: 'BEDAŞ siparişi için hücre testleri başarıyla tamamlandı.',
        department: 'Test',
        priority: 'medium',
        type: 'success',
        isRead: true,
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000) // 8 saat önce
      },
      {
        id: 5,
        title: 'Teknik Doküman Güncellendi',
        content: 'RM 36 CB Teknik Çizim dokümanı revize edildi (Rev. 2.1).',
        department: 'Teknik Ofis',
        priority: 'low',
        type: 'info',
        isRead: false,
        timestamp: new Date(now.getTime() - 28 * 60 * 60 * 1000) // 28 saat önce
      }
    ];
    
    notifications.value = demoNotifications.map(notification => ({
      ...notification,
      formattedTime: formatTimeAgo(notification.timestamp)
    }));
    
    unreadCount.value = demoNotifications.filter(n => !n.isRead).length;
    lastCheck.value = new Date();
  }

  /**
   * Belirli bir bildirimi okundu olarak işaretle
   * @param {number} id - Bildirim ID'si
   */
  function markAsRead(id) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      if (!notifications.value[index].isRead) {
        notifications.value[index].isRead = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
      
      // Gerçek uygulamada API'ye de bildirim
      // erpService.markNotificationAsRead(id);
    }
  }

  /**
   * Tüm bildirimleri okundu olarak işaretle
   */
  function markAllAsRead() {
    notifications.value.forEach(notification => {
      notification.isRead = true;
    });
    unreadCount.value = 0;
    
    // Gerçek uygulamada API'ye de bildirim
    // erpService.markAllNotificationsAsRead();
  }

  /**
   * Yeni bir bildirim ekle
   * @param {Object} notification - Bildirim nesnesi
   */
  function addNotification(notification) {
    const id = notification.id || Date.now();
    const newNotification = {
      id,
      title: notification.title,
      content: notification.content,
      department: notification.department || 'Sistem',
      priority: notification.priority || 'medium',
      type: notification.type || 'info',
      isRead: notification.isRead || false,
      timestamp: notification.timestamp || new Date(),
      formattedTime: formatTimeAgo(notification.timestamp || new Date())
    };
    
    notifications.value.unshift(newNotification);
    
    if (!newNotification.isRead) {
      unreadCount.value++;
      
      // Web Push bildirimi gönder (kullanıcı izin verdiyse)
      sendWebPushNotification(newNotification);
    }
    
    // Maksimum bildirim sayısını kontrol et ve eski bildirimleri temizle
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100);
    }
    
    // Bildirimleri tarihe göre sırala
    notifications.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Web Push bildirimi gönder
   * @param {Object} notification - Bildirim nesnesi
   */
  function sendWebPushNotification(notification) {
    if (!('Notification' in window)) {
      return; // Tarayıcı bildirimleri desteklemiyor
    }
    
    if (Notification.permission === 'granted') {
      const title = notification.title;
      const options = {
        body: notification.content,
        icon: '/assets/icons/notification-icon.png',
        tag: `notification-${notification.id}`,
        data: {
          url: `/notifications/${notification.id}`,
          notificationId: notification.id
        },
        vibrate: [200, 100, 200]
      };
      
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  /**
   * Web bildirimleri için kullanıcı izni iste
   */
  function requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Bu tarayıcı bildirim desteği sunmuyor');
      return Promise.resolve(false);
    }
    
    if (Notification.permission === 'granted') {
      return Promise.resolve(true);
    }
    
    if (Notification.permission === 'denied') {
      console.log('Bildirim izinleri reddedildi');
      return Promise.resolve(false);
    }
    
    return Notification.requestPermission().then(permission => {
      return permission === 'granted';
    });
  }

  /**
   * Gerçek zamanlı bildirim dinleyicisi başlat
   */
  function initializeRealTimeNotifications() {
    // WebSocket kurulumu (gerçek uygulamada)
    // const socket = new WebSocket('wss://api.mehmetendüstriyel.com/notifications');
    
    // socket.addEventListener('message', (event) => {
    //   const notification = JSON.parse(event.data);
    //   addNotification(notification);
    // });
    
    // Demo için
    const initInterval = setInterval(() => {
      // Rastgele bildirimler ekle (demo)
      if (Math.random() > 0.8) {
        const demoTypes = ['warning', 'info', 'success'];
        const demoPriorities = ['high', 'medium', 'low'];
        const demoDepartments = ['Üretim', 'Satın Alma', 'Test', 'Teknik', 'Montaj'];
        
        const randomNotification = {
          title: `Test Bildirimi - ${new Date().toLocaleTimeString()}`,
          content: `Bu bir otomatik test bildirimidir. (${Math.floor(Math.random() * 1000)})`,
          department: demoDepartments[Math.floor(Math.random() * demoDepartments.length)],
          priority: demoPriorities[Math.floor(Math.random() * demoPriorities.length)],
          type: demoTypes[Math.floor(Math.random() * demoTypes.length)],
          timestamp: new Date()
        };
        
        addNotification(randomNotification);
      }
    }, 60000); // Her dakika kontrol et
    
    // Temizleme fonksiyonu
    return () => {
      clearInterval(initInterval);
      // socket.close();
    };
  }

  /**
   * Okunmamış bildirimlerin sayısını döndür
   */
  function getUnreadCount() {
    return unreadCount.value;
  }

  // Bildirimleri düzenli olarak yenile
  function startPeriodicRefresh(intervalMs = 300000) { // 5 dakika
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, intervalMs);
    
    // Temizleme fonksiyonu
    return () => clearInterval(intervalId);
  }

  // İnitialize
  function initialize() {
    fetchNotifications().catch(() => {
      console.log('Gerçek bildirimler yüklenemedi, demo verilerle çalışılıyor');
      loadDemoNotifications();
    });
    
    return {
      cleanup: initializeRealTimeNotifications(),
      refreshCleanup: startPeriodicRefresh()
    };
  }

  return {
    notifications,
    unreadNotifications,
    importantNotifications,
    sortedNotifications,
    unreadCount,
    lastCheck,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    getUnreadCount,
    requestNotificationPermission,
    initialize
  };
});