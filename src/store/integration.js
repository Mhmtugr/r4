import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useNotificationStore } from './notification';
import { apiService } from '@/services/api-service';

export const useIntegrationStore = defineStore('integration', () => {
  // State
  const serviceStatus = ref({
    ERP: { status: 'pending', lastCheck: null, details: null },
    MRP: { status: 'pending', lastCheck: null, details: null },
    KIOSK: { status: 'pending', lastCheck: null, details: null },
    DB: { status: 'pending', lastCheck: null, details: null }
  });
  
  const modules = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  
  // Notification erişimi
  const notificationStore = useNotificationStore();
  
  // Getters
  const allServicesConnected = computed(() => {
    return Object.values(serviceStatus.value).every(service => service.status === 'connected');
  });
  
  const anyServiceError = computed(() => {
    return Object.values(serviceStatus.value).some(service => service.status === 'error');
  });

  const activeModules = computed(() => {
    return modules.value.filter(m => m.isActive);
  });
  
  // Actions
  async function checkServiceStatus() {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Entegrasyon durumunu kontrol et
      const statusResponse = await apiService.get('/integration/status');
      
      // Servis durumlarını güncelle
      if (statusResponse && statusResponse.data) {
        const now = new Date();
        
        Object.keys(statusResponse.data).forEach(key => {
          if (serviceStatus.value[key]) {
            serviceStatus.value[key] = {
              status: statusResponse.data[key].connected ? 'connected' : 'error',
              lastCheck: now.toISOString(),
              details: statusResponse.data[key].details || null
            };
          }
        });
      }
      
      // Servis hatası varsa bildirim göster
      if (anyServiceError.value) {
        notificationStore.showNotification({
          type: 'warning',
          message: 'Bazı servislerle bağlantı kurulamadı. Sistem Durumu panelinden detayları kontrol edebilirsiniz.',
          duration: 8000
        });
      }
      
      return { success: true, status: serviceStatus.value };
    } catch (err) {
      console.error('Servis durumu kontrol hatası:', err);
      error.value = err.message || 'Servis durumu kontrol edilemedi';
      
      notificationStore.showNotification({
        type: 'error',
        message: 'Servis durumu kontrol edilemedi: ' + (err.message || 'Bilinmeyen hata')
      });
      
      return { 
        success: false, 
        error: err.message 
      };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function loadModules() {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await apiService.get('/modules');
      modules.value = response.data || [];
      return { success: true, modules: modules.value };
    } catch (err) {
      console.error('Modül yükleme hatası:', err);
      error.value = err.message || 'Modüller yüklenemedi';
      return { success: false, error: err.message };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function initializeIntegration() {
    // Servis durumlarını kontrol et
    await checkServiceStatus();
    
    // Modülleri yükle
    await loadModules();
    
    // Başlatma başarılıysa
    if (!error.value) {
      console.log('Entegrasyon başlatıldı:', {
        services: serviceStatus.value,
        activeModules: activeModules.value
      });
      return true;
    }
    
    return false;
  }
  
  async function reconnectService(serviceName) {
    if (!serviceStatus.value[serviceName]) {
      throw new Error(`Bilinmeyen servis: ${serviceName}`);
    }
    
    isLoading.value = true;
    
    try {
      // Servisi yeniden bağlamaya çalış
      const response = await apiService.post('/integration/reconnect', { service: serviceName });
      
      if (response.data && response.data.success) {
        // Başarılı bağlantı
        serviceStatus.value[serviceName] = {
          status: 'connected',
          lastCheck: new Date().toISOString(),
          details: response.data.details || null
        };
        
        notificationStore.showNotification({
          type: 'success',
          message: `${serviceName} servisi ile bağlantı kuruldu.`
        });
        
        return { success: true };
      } else {
        // Bağlantı hatası
        serviceStatus.value[serviceName] = {
          status: 'error',
          lastCheck: new Date().toISOString(),
          details: response.data?.details || 'Bağlantı sağlanamadı'
        };
        
        notificationStore.showNotification({
          type: 'error',
          message: `${serviceName} servisi ile bağlantı kurulamadı.`
        });
        
        return { success: false };
      }
    } catch (err) {
      console.error(`${serviceName} yeniden bağlantı hatası:`, err);
      
      serviceStatus.value[serviceName] = {
        status: 'error',
        lastCheck: new Date().toISOString(),
        details: err.message || 'Bağlantı hatası'
      };
      
      notificationStore.showNotification({
        type: 'error',
        message: `${serviceName} servisi ile bağlantı kurulamadı: ${err.message || 'Bilinmeyen hata'}`
      });
      
      return { success: false, error: err.message };
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    serviceStatus,
    modules,
    isLoading,
    error,
    
    // Getters
    allServicesConnected,
    anyServiceError,
    activeModules,
    
    // Actions
    checkServiceStatus,
    loadModules,
    initializeIntegration,
    reconnectService
  };
});