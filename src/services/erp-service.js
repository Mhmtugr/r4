/**
 * ERP Servisi
 * Canias ERP entegrasyonu için modern servis implementasyonu
 */

import { apiService } from './api-service';
import appConfig from '@/config'; // Import config
// import logger from '@/utils/logger'; // Opsiyonel: Logger kullanımı

class ErpService {
  constructor() {
    // Config dosyasından veya ortam değişkenlerinden al
    // mockMode doğrudan apiService tarafından yönetildiği için burada tekrar tanımlamaya gerek yok.
    this.initialized = false;
    this.cachedStockData = null;
    // logger.info('ERP Servisi başlatılıyor...'); // Logger kullanımı örneği
  }

  init() {
    // Gerekirse asenkron başlatma işlemleri burada yapılabilir
    this.initialized = true;
    // logger.info('ERP Servisi başarıyla başlatıldı');
    return this.initialized;
  }

  // Malzeme ve stok yönetimi
  async getMaterials() {
    // Mock mod kontrolü apiService içinde yapılıyor
    try {
      const response = await apiService.get('/erp/materials');
      return response.materials || []; // Dönen verinin yapısına göre ayarla
    } catch (error) {
      // logger.error('ERP Malzeme verisi alınamadı:', error);
      console.error('ERP Malzeme verisi alınamadı:', error);
      // Hata durumunda boş array dönmek veya hatayı tekrar fırlatmak daha iyi olabilir
      // throw new Error('Malzeme verisi alınamadı'); 
      return []; // Boş array dönelim
    }
  }

  async getStockData() {
    // apiService mock modu yönetecek
    if (this.cachedStockData && !apiService.mockMode) { // Cache'i sadece mock modda değilken kullan
      return this.cachedStockData;
    }

    try {
      const response = await apiService.get('/erp/stock');
      this.cachedStockData = response.stock || [];
      return this.cachedStockData;
    } catch (error) {
      // logger.error('ERP Stok verisi alınamadı:', error);
      console.error('ERP Stok verisi alınamadı:', error);
      // Hata durumunda mock veriye dönmek yerine hata fırlatmak daha iyi
      // throw new Error('Stok verisi alınamadı');
      this.cachedStockData = this.getDemoStockData(); // Şimdilik mock'a dönelim
      return this.cachedStockData;
    }
  }

  async checkMaterialAvailability(materialCode) {
     // apiService mock modu yönetecek
    try {
      // Mock mod için apiService'in mock handler'ı çalışacak
      const response = await apiService.get(`/erp/materials/${materialCode}/availability`);
      return response;
    } catch (error) {
      // logger.error(`ERP Malzeme durumu alınamadı (${materialCode}):`, error);
      console.error(`ERP Malzeme durumu alınamadı (${materialCode}):`, error);
      // throw new Error('Malzeme durumu alınamadı');
       return { code: materialCode, available: 0, status: 'error' }; // Hata durumu için obje dönelim
    }
  }

  // Sipariş yönetimi
  async getOrders() {
    try {
      const response = await apiService.get('/erp/orders');
      return response.orders || [];
    } catch (error) {
      // logger.error('ERP Sipariş verisi alınamadı:', error);
      console.error('ERP Sipariş verisi alınamadı:', error);
      // throw new Error('Sipariş verisi alınamadı');
      return [];
    }
  }

  async getOrderDetails(orderNo) {
     try {
       const response = await apiService.get(`/erp/orders/${orderNo}`);
       // apiService mock handler'ı zaten order bulunamadı durumunu yönetebilir
       return response.order; // Başarılı durumda order nesnesini dön
     } catch (error) {
       // logger.error(`ERP Sipariş detayları alınamadı (${orderNo}):`, error);
       console.error(`ERP Sipariş detayları alınamadı (${orderNo}):`, error);
       // throw new Error('Sipariş detayları alınamadı');
       return null; // Hata durumunda null dönelim
     }
   }

  async createOrder(orderData) {
    try {
      // Mock modda apiService mock response dönecek
      const response = await apiService.post('/erp/orders', orderData);
      return response; // Dönen yanıtı doğrudan ilet
    } catch (error) {
      // logger.error('ERP Sipariş oluşturulamadı:', error);
      console.error('ERP Sipariş oluşturulamadı:', error);
      // throw new Error('Sipariş oluşturulamadı');
      return { success: false, error: error.message || 'Sipariş oluşturulamadı' };
    }
  }

  // Üretim yönetimi
  async getProductionStatus() {
    try {
      const response = await apiService.get('/erp/production');
      return response.production || [];
    } catch (error) {
      // logger.error('ERP Üretim durumu alınamadı:', error);
      console.error('ERP Üretim durumu alınamadı:', error);
      // throw new Error('Üretim durumu alınamadı');
       return [];
    }
  }

  async updateProductionStatus(orderId, stageData) {
    try {
      const response = await apiService.put(`/erp/production/${orderId}/status`, stageData);
      return response;
    } catch (error) {
      // logger.error(`ERP Üretim durumu güncellenemedi (${orderId}):`, error);
      console.error(`ERP Üretim durumu güncellenemedi (${orderId}):`, error);
      // throw new Error('Üretim durumu güncellenemedi');
      return { success: false, error: error.message || 'Üretim durumu güncellenemedi' };
    }
  }

  // Malzeme rezervasyon
  async reserveMaterialsForOrder(orderId, materials) {
    try {
      const response = await apiService.post(`/erp/materials/reserve`, { orderId, materials });
      return response;
    } catch (error) {
      // logger.error(`ERP Malzeme rezervasyonu başarısız (${orderId}):`, error);
      console.error(`ERP Malzeme rezervasyonu başarısız (${orderId}):`, error);
      // throw new Error('Malzeme rezervasyonu yapılamadı');
      return { success: false, error: error.message || 'Malzeme rezervasyonu yapılamadı' };
    }
  }

  // Yerel depolama (Şimdilik kaldırıldı, ihtiyaç olursa tekrar eklenebilir)
  /*
  saveDataLocally(key, data) { ... }
  loadDataLocally(key) { ... }
  */

  // Mock veriler (Artık apiService içinde yönetiliyor, buradakiler referans olarak kalabilir veya silinebilir)
  // getMockMaterials() { ... }
  // getDemoStockData() { ... }
  // getMockOrders() { ... }
  // getMockProductionStatus() { ... }
   getDemoStockData() { // getStockData içinde hata durumunda kullanılıyor
    return [
      {
        code: '137998%',
        name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC',
        quantity: 2,
        availableQuantity: 2,
        allocatedQuantity: 0,
        minQuantity: 5
      },
      {
        code: '144866%',
        name: 'KAP-80/190-95 Akım Trafosu',
        quantity: 3,
        availableQuantity: 1,
        allocatedQuantity: 2,
        minQuantity: 5
      },
    ];
  }
}

// Singleton instance oluştur ve export et
export const erpService = new ErpService();

/**
 * ERP Service composable fonksiyonu - ai-service.js için gerekli
 * @returns {Object} ERP Service instance
 */
export const useErpService = () => {
  // Eğer başlatılmamışsa başlat
  if (!erpService.initialized) {
    erpService.init();
  }
  
  return erpService;
};