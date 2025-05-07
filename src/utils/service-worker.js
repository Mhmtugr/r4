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