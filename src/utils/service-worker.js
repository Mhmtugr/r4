/**
 * METS - Service Worker Yardımcı İşlevleri
 * PWA destek işlevselliği için kullanılır
 */

/**
 * Service Worker'ı kaydet
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker başarıyla kaydedildi:', registration.scope);
        return registration;
      })
      .catch(error => {
        console.error('Service Worker kaydı başarısız:', error);
        return null;
      });
  }
  
  console.warn('Service Worker bu tarayıcıda desteklenmiyor.');
  return Promise.resolve(null);
}

/**
 * Service Worker'ı güncelle
 * @returns {Promise<boolean>}
 */
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready
      .then(registration => {
        return registration.update()
          .then(() => {
            console.log('Service Worker güncellendi');
            return true;
          })
          .catch(error => {
            console.error('Service Worker güncelleme hatası:', error);
            return false;
          });
      })
      .catch(error => {
        console.error('Service Worker hazır değil:', error);
        return false;
      });
  }
  
  return Promise.resolve(false);
}

/**
 * Service Worker'ı kaldır
 * @returns {Promise<boolean>}
 */
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready
      .then(registration => {
        return registration.unregister()
          .then(success => {
            if (success) {
              console.log('Service Worker kaldırıldı');
            } else {
              console.warn('Service Worker kaldırılamadı');
            }
            return success;
          })
          .catch(error => {
            console.error('Service Worker kaldırma hatası:', error);
            return false;
          });
      })
      .catch(error => {
        console.error('Service Worker hazır değil:', error);
        return false;
      });
  }
  
  return Promise.resolve(false);
}

/**
 * Service Worker'ın kayıtlı olup olmadığını kontrol eder
 * @returns {Promise<boolean>} Service worker'ın kayıtlı olup olmadığı
 */
export const isServiceWorkerRegistered = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    } catch (error) {
      console.error('Service Worker kaydı kontrolü başarısız:', error);
      return false;
    }
  }
  return false;
};

/**
 * Service Worker için yükleme isteği olaylarını yönetir
 * @returns {Promise<Object|null>} BeforeInstallPromptEvent olayı veya null
 */
export const handleInstallPrompt = () => {
  return new Promise((resolve) => {
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (event) => {
      // Tarayıcının varsayılan promptunu engelle
      event.preventDefault();
      // Olayı daha sonra kullanmak üzere sakla
      deferredPrompt = event;
      resolve(deferredPrompt);
    });

    // Eğer sayfa yüklendiğinde olay zaten tetiklenmişse null dön
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (!deferredPrompt) {
          resolve(null);
        }
      }, 3000);
    });
  });
};

/**
 * PWA kurulum istemini göster
 * @param {BeforeInstallPromptEvent} deferredPrompt - Önceden saklanan yükleme istem olayı
 * @returns {Promise<boolean>} Kurulumun başarılı olup olmadığı
 */
export const showInstallPrompt = async (deferredPrompt) => {
  if (!deferredPrompt) return false;

  try {
    // İstemi göster
    deferredPrompt.prompt();
    // Kullanıcı yanıtını bekle
    const result = await deferredPrompt.userChoice;
    // Sonucu döndür
    return result.outcome === 'accepted';
  } catch (error) {
    console.error('PWA kurulumu gösterilirken hata:', error);
    return false;
  }
};

/**
 * Service Worker güncellemelerini kontrol eder ve varsa yeni sürümü yüklemeyi önerir
 */
export const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        // Kontrolleri hemen güncelle, böylece yeni service worker'ın kontrolü ele alması sağlanır
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Yeni service worker hazır, uygulama güncellenebilir
              showUpdateNotification();
            }
          });
        });
        
        // Service Worker'ı güncellemeler için zorla
        registration.update();
      }
    } catch (error) {
      console.error('Service Worker güncellemesi kontrol edilirken hata:', error);
    }
  }
};

/**
 * Yeni bir güncelleme olduğunda kullanıcıya bildirim gösterir
 */
export const showUpdateNotification = () => {
  // Uygulama yeni sürüm bildirimi
  document.dispatchEvent(new CustomEvent('swUpdateAvailable', { 
    detail: { 
      reload: () => window.location.reload() 
    } 
  }));
};

/**
 * Çevrimdışı durumu değişikliklerini dinler ve kullanıcıya bildirir
 * @param {Function} onOffline - Çevrimdışı olduğunda çağrılacak fonksiyon
 * @param {Function} onOnline - Çevrimiçi olduğunda çağrılacak fonksiyon
 */
export const listenToNetworkChanges = (onOffline, onOnline) => {
  window.addEventListener('online', () => {
    if (typeof onOnline === 'function') onOnline();
  });
  
  window.addEventListener('offline', () => {
    if (typeof onOffline === 'function') onOffline();
  });
  
  // Mevcut bağlantı durumunu kontrol et
  if (!navigator.onLine && typeof onOffline === 'function') {
    onOffline();
  }
};

export default {
  isServiceWorkerRegistered,
  handleInstallPrompt,
  showInstallPrompt,
  checkForUpdates,
  showUpdateNotification,
  listenToNetworkChanges
};

/**
 * Service Worker Yönetimi
 * Çevrimdışı çalışma modu ve PWA özellikleri için
 */

const CACHE_NAME = 'mets-app-cache-v1';

// Önbelleklenecek varlıklar
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/images/logo.png',
  '/assets/icons/favicon.ico'
];

// İsteğe bağlı önbelleğe alma stratejileri
const strategies = {
  networkFirst: async (cacheName, request) => {
    try {
      // Önce ağdan deneyin
      const networkResponse = await fetch(request);
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (err) {
      // Ağ erişimi yoksa önbellekten deneyin
      const cachedResponse = await caches.match(request);
      return cachedResponse || caches.match('/offline.html');
    }
  },

  cacheFirst: async (cacheName, request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (err) {
      return caches.match('/offline.html');
    }
  },
  
  staleWhileRevalidate: async (cacheName, request) => {
    // Önbelleği kontrol edin
    const cachedResponse = await caches.match(request);
    
    // Arka planda güncelleme işlemini başlatın
    const fetchPromise = fetch(request)
      .then(networkResponse => {
        caches.open(cacheName)
          .then(cache => {
            cache.put(request, networkResponse.clone());
          });
        return networkResponse;
      })
      .catch(error => {
        console.error('Fetch failed; returning offline page instead.', error);
        return caches.match('/offline.html');
      });
    
    // Önbellekte varsa onu hemen döndürün, yoksa fetch işlemini bekleyin
    return cachedResponse || fetchPromise;
  }
};

// Service worker yükleme ve önbelleğe alma
self.addEventListener('install', event => {
  console.log('Service Worker yükleniyor...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Varlıklar önbelleğe alınıyor');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Service worker aktifleştirme ve eski önbellekleri temizleme
self.addEventListener('activate', event => {
  console.log('Service Worker aktifleştirildi');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski önbellek temizleniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// İstek yakalama ve strateji uygulama
self.addEventListener('fetch', event => {
  // API istekleri için network-first stratejisi
  if (event.request.url.includes('/api/')) {
    event.respondWith(strategies.networkFirst(CACHE_NAME, event.request));
    return;
  }
  
  // Statik kaynaklar için cache-first stratejisi
  if (event.request.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(strategies.cacheFirst(CACHE_NAME, event.request));
    return;
  }
  
  // HTML sayfaları için stale-while-revalidate stratejisi
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(strategies.staleWhileRevalidate(CACHE_NAME, event.request));
    return;
  }
  
  // Diğer tüm istekler için network-first stratejisi
  event.respondWith(strategies.networkFirst(CACHE_NAME, event.request));
});

// Push bildirimlerini yakala
self.addEventListener('push', event => {
  if (!event.data) {
    return;
  }
  
  try {
    const payload = event.data.json();
    const options = {
      body: payload.body,
      icon: '/assets/icons/notification-icon.png',
      badge: '/assets/icons/badge-icon.png',
      data: payload.data || {},
      actions: payload.actions || [],
      vibrate: [100, 50, 100]
    };
    
    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  } catch (error) {
    console.error('Push bildirimi işlenirken hata:', error);
  }
});

// Bildirim tıklama olaylarını yakala
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      // Açık bir pencere varsa, ona odaklan ve URL'i güncelle
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Yoksa yeni bir pencere aç
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Senkronizasyon olaylarını yakala (çevrimdışı verileri senkronize etmek için)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-changes') {
    event.waitUntil(syncPendingChanges());
  }
});

// Çevrimdışı değişiklikleri senkronize et
async function syncPendingChanges() {
  try {
    const db = await openDB();
    const pendingActions = await db.getAll('pendingActions');
    
    for (const action of pendingActions) {
      try {
        await processPendingAction(action);
        await db.delete('pendingActions', action.id);
      } catch (error) {
        console.error(`Bekleyen işlem senkronize edilemedi (ID: ${action.id}):`, error);
      }
    }
    
    console.log('Tüm bekleyen değişiklikler senkronize edildi.');
  } catch (error) {
    console.error('Bekleyen değişiklikler senkronize edilirken hata:', error);
  }
}

// IndexedDB'ye erişim için yardımcı fonksiyon
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('metsOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('offlineData', { keyPath: 'key' });
    };
  });
}

// Bekleyen işlemi işle
async function processPendingAction(action) {
  const { type, url, method, data, headers } = action;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: data ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    throw new Error(`Network yanıtı başarısız: ${response.status}`);
  }
  
  return response.json();
}