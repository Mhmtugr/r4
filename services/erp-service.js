/**
 * ERP Servisi
 * Canias ERP entegrasyonu için gerçek zamanlı iki yönlü senkronizasyon destekli implementasyon
 */

import { apiService } from './api-service';
import { useEventBus } from '@/utils/event-bus';
import appConfig from '@/config';
import logger from '@/utils/logger';
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/store/auth';

// Değişiklikleri izleme ve veri senkronizasyonu için durum değişkenleri
const syncStatus = ref('disconnected'); // disconnected, connecting, connected, reconnecting, error
const lastSyncTime = ref(null);
const pendingChanges = reactive([]);
const dataVersion = ref(0); // Local veri versiyonu
const syncErrors = ref([]);
const connectionAttempts = ref(0);

class ErpService {
  constructor() {
    this.initialized = false;
    this.cachedStockData = null;
    this.socket = null;
    this.eventBus = useEventBus();
    this.retryTimeout = null;
    this.authStore = null;
    this.syncInterval = null;
    this.publishQueueProcessor = null;
    this.offlineQueue = [];
    this.listeners = {};
    
    // WebSocket event konuları
    this.topics = {
      STOCK_UPDATED: 'stock:updated',
      MATERIAL_UPDATED: 'material:updated',
      ORDER_UPDATED: 'order:updated',
      PRODUCTION_UPDATED: 'production:updated',
      PLANNING_UPDATED: 'planning:updated'
    };
    
    logger.info('ERP Servisi başlatılıyor...');
  }

  /**
   * Servis başlatma ve WebSocket bağlantısı kurma
   */
  async init() {
    try {
      if (this.initialized) return true;
      
      this.authStore = useAuthStore();
      
      await this.initOfflineStorage();
      await this.setupWebSocketConnection();
      
      // Periyodik senkronizasyon kontrolü başlat
      this.startSyncInterval();
      
      // Yayınlama kuyruğu işlemcisini başlat
      this.startPublishQueueProcessor();
      
      this.initialized = true;
      logger.info('ERP Servisi başarıyla başlatıldı');
      
      // Çevrimdışı kayıtları senkronize et (eğer varsa)
      this.syncOfflineChanges();
      
      return true;
    } catch (error) {
      logger.error('ERP Servisi başlatılamadı:', error);
      syncStatus.value = 'error';
      return false;
    }
  }
  
  /**
   * WebSocket bağlantısı kurma ve olay dinleyicileri ekleme
   */
  async setupWebSocketConnection() {
    try {
      if (apiService.mockMode) {
        logger.warn('Mock modda WebSocket bağlantısı kurulmayacak');
        syncStatus.value = 'connected';
        return;
      }
      
      syncStatus.value = 'connecting';
      
      // Kullanıcı token'ını al
      const token = this.authStore.getToken();
      if (!token) {
        throw new Error('Canias ERP bağlantısı için yetkilendirme token\'ı bulunamadı');
      }
      
      // WebSocket URL'i oluştur
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${appConfig.ERP_API_HOST || window.location.host}/api/erp/ws`;
      
      // Bağlantıyı kapat (eğer zaten varsa)
      if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
        this.socket.close();
      }
      
      // Yeni WebSocket bağlantısı oluştur
      this.socket = new WebSocket(`${wsUrl}?token=${token}`);
      
      // Bağlantı olaylarını dinle
      this.socket.addEventListener('open', this.handleSocketOpen.bind(this));
      this.socket.addEventListener('message', this.handleSocketMessage.bind(this));
      this.socket.addEventListener('close', this.handleSocketClose.bind(this));
      this.socket.addEventListener('error', this.handleSocketError.bind(this));
      
    } catch (error) {
      logger.error('WebSocket bağlantısı kurulamadı:', error);
      syncStatus.value = 'error';
      this.scheduleReconnect();
    }
  }
  
  /**
   * WebSocket bağlantısı açıldığında
   */
  handleSocketOpen(event) {
    syncStatus.value = 'connected';
    connectionAttempts.value = 0;
    lastSyncTime.value = new Date();
    logger.info('WebSocket bağlantısı kuruldu');
    
    // Olay dinleyicilerini kaydet
    this.registerTopics();
    
    // Offline verileri senkronize et
    this.syncOfflineChanges();
    
    // Durumu bildir
    this.eventBus.emit('erp:connected');
  }
  
  /**
   * WebSocket'ten mesaj geldiğinde
   */
  handleSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'WELCOME':
          logger.info('ERP WebSocket hoşgeldin mesajı alındı:', message.data);
          break;
          
        case 'UPDATE':
          this.handleUpdateMessage(message.topic, message.data);
          break;
          
        case 'SYNC_RESPONSE':
          this.handleSyncResponse(message.data);
          break;
          
        case 'ERROR':
          logger.error('ERP WebSocket hata mesajı:', message.data);
          break;
          
        default:
          logger.warn('Bilinmeyen ERP mesaj tipi:', message.type);
      }
    } catch (error) {
      logger.error('WebSocket mesajı işlenirken hata:', error, event.data);
    }
  }
  
  /**
   * Update tipindeki mesajları işleme
   */
  handleUpdateMessage(topic, data) {
    // Yerel veri güncelleme
    switch (topic) {
      case this.topics.STOCK_UPDATED:
        // Stok verilerini güncelle
        this.cachedStockData = null; // Cache'i geçersiz kıl
        this.eventBus.emit('erp:stock-updated', data);
        break;
        
      case this.topics.MATERIAL_UPDATED:
        // Malzeme verilerini güncelle
        this.eventBus.emit('erp:material-updated', data);
        break;
        
      case this.topics.ORDER_UPDATED:
        // Sipariş verilerini güncelle
        this.eventBus.emit('erp:order-updated', data);
        break;
        
      case this.topics.PRODUCTION_UPDATED:
        // Üretim verilerini güncelle
        this.eventBus.emit('erp:production-updated', data);
        break;
        
      case this.topics.PLANNING_UPDATED:
        // Planlama verilerini güncelle
        this.eventBus.emit('erp:planning-updated', data);
        break;
        
      default:
        logger.warn('Bilinmeyen update topic\'i:', topic);
    }
    
    // Son senkronizasyon zamanını güncelle
    lastSyncTime.value = new Date();
    dataVersion.value++;
  }
  
  /**
   * Senkronizasyon yanıtını işleme
   */
  handleSyncResponse(data) {
    if (data.success) {
      // Başarılı senkronizasyon
      const syncedItems = data.syncedItems || [];
      
      // Senkronize edilen öğeleri kuyruktan kaldır
      if (syncedItems.length > 0) {
        pendingChanges.splice(
          0,
          pendingChanges.findIndex(change => 
            syncedItems.some(item => item.id === change.id)
          ) + 1
        );
      }
      
      logger.info(`${syncedItems.length} öğe başarıyla senkronize edildi`);
      lastSyncTime.value = new Date();
    } else {
      // Başarısız senkronizasyon
      logger.error('Senkronizasyon hatası:', data.error);
      syncErrors.value.push({
        timestamp: new Date(),
        message: data.error || 'Bilinmeyen senkronizasyon hatası',
        data: data
      });
    }
  }
  
  /**
   * WebSocket bağlantısı kapandığında
   */
  handleSocketClose(event) {
    if (syncStatus.value === 'connected') {
      syncStatus.value = 'reconnecting';
      logger.warn('WebSocket bağlantısı kapandı, yeniden bağlanılacak:', event.code, event.reason);
      this.scheduleReconnect();
    }
  }
  
  /**
   * WebSocket bağlantısı hata verdiğinde
   */
  handleSocketError(event) {
    logger.error('WebSocket bağlantısı hata verdi:', event);
    syncStatus.value = 'error';
    this.scheduleReconnect();
  }
  
  /**
   * Yeniden bağlanma zamanlayıcısını ayarlama
   */
  scheduleReconnect() {
    // Önceki zamanlayıcıyı temizle
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    // Üstel geri çekilme algoritması
    const baseDelay = 1000; // 1 saniye
    const maxDelay = 30000; // 30 saniye
    const jitter = Math.random() * 0.5 + 0.75; // 0.75-1.25 arası rastgele çarpan
    
    connectionAttempts.value++;
    const delay = Math.min(baseDelay * Math.pow(1.5, connectionAttempts.value) * jitter, maxDelay);
    
    logger.info(`Yeniden bağlanma denemesi ${connectionAttempts.value} - ${Math.round(delay / 1000)} saniye sonra`);
    
    this.retryTimeout = setTimeout(() => {
      if (syncStatus.value !== 'connected') {
        this.setupWebSocketConnection();
      }
    }, delay);
  }
  
  /**
   * Konulara abone olma
   */
  registerTopics() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    
    // Tüm konulara abone ol
    Object.values(this.topics).forEach(topic => {
      this.socket.send(JSON.stringify({
        action: 'SUBSCRIBE',
        topic: topic
      }));
    });
    
    logger.info('ERP konularına abone olundu');
  }
  
  /**
   * Offline depolama sistemini başlatma
   */
  async initOfflineStorage() {
    try {
      // IndexedDB veya localStorage kullanarak offline veri depolama
      // Şimdi için basit bir implementasyon yapacağız
      
      // localStorage'dan bekleyen değişiklikleri yükle
      const savedChanges = localStorage.getItem('erp_pending_changes');
      if (savedChanges) {
        try {
          const parsedChanges = JSON.parse(savedChanges);
          if (Array.isArray(parsedChanges)) {
            pendingChanges.push(...parsedChanges);
            logger.info(`${parsedChanges.length} bekleyen değişiklik yüklendi`);
          }
        } catch (e) {
          logger.error('Bekleyen değişiklikler yüklenemedi:', e);
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Offline depolama başlatılamadı:', error);
      return false;
    }
  }
  
  /**
   * Bekleyen değişiklikleri kaydetme
   */
  savePendingChanges() {
    try {
      localStorage.setItem('erp_pending_changes', JSON.stringify(pendingChanges));
    } catch (error) {
      logger.error('Bekleyen değişiklikler kaydedilemedi:', error);
    }
  }
  
  /**
   * Çevrimdışı değişiklikleri senkronize etme
   */
  async syncOfflineChanges() {
    if (pendingChanges.length === 0) return;
    
    if (syncStatus.value !== 'connected' || apiService.mockMode) {
      logger.info('Çevrimiçi olmadığı için çevrimdışı değişiklikler senkronize edilemiyor');
      return;
    }
    
    logger.info(`${pendingChanges.length} çevrimdışı değişiklik senkronize ediliyor`);
    
    try {
      // Her bir değişikliği senkronize et
      for (const change of [...pendingChanges]) {
        await this.publishChange(change);
      }
      
      logger.info('Çevrimdışı değişiklikler senkronize edildi');
    } catch (error) {
      logger.error('Çevrimdışı değişiklikleri senkronize ederken hata:', error);
    }
  }
  
  /**
   * Periyodik senkronizasyon kontrolünü başlatma
   */
  startSyncInterval() {
    // Her 1 dakikada bir senkronizasyon kontrolü yap
    this.syncInterval = setInterval(() => {
      // Eğer bekleyen değişiklikler varsa ve çevrimiçiysek, senkronize et
      if (pendingChanges.length > 0 && syncStatus.value === 'connected') {
        this.syncOfflineChanges();
      }
      
      // WebSocket bağlantısı kopmuşsa yeniden bağlan
      if (syncStatus.value !== 'connected' && syncStatus.value !== 'connecting') {
        logger.info('Periyodik senkronizasyon kontrolü: yeniden bağlanılıyor');
        this.setupWebSocketConnection();
      }
      
    }, 60000); // 60 saniye
  }
  
  /**
   * Yayınlama kuyruğu işleyicisini başlatma
   */
  startPublishQueueProcessor() {
    // Kuyruk işlemcisi - her 5 saniyede bir kontrol et
    this.publishQueueProcessor = setInterval(() => {
      if (this.offlineQueue.length > 0 && syncStatus.value === 'connected') {
        const item = this.offlineQueue.shift();
        this.publishChange(item.change).catch(error => {
          logger.error('Değişiklik yayınlanırken hata:', error);
          // Yeniden kuyruğa ekle
          this.offlineQueue.push(item);
        });
      }
    }, 5000);
  }
  
  /**
   * Değişikliği WebSocket üzerinden yayınlama
   */
  async publishChange(change) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // Bağlantı yoksa kuyruğa ekle
      this.offlineQueue.push({ change, timestamp: Date.now() });
      return false;
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Mesaj ID'sini oluştur
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Yanıt için tek seferlik dinleyici
        const responseListener = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'SYNC_RESPONSE' && message.messageId === messageId) {
              // Dinleyiciyi kaldır
              this.socket.removeEventListener('message', responseListener);
              
              if (message.data.success) {
                resolve(message.data);
              } else {
                reject(new Error(message.data.error || 'Senkronizasyon hatası'));
              }
            }
          } catch (error) {
            logger.error('Yanıt işlenirken hata:', error);
          }
        };
        
        // Yanıtı dinle
        this.socket.addEventListener('message', responseListener);
        
        // Değişikliği gönder
        this.socket.send(JSON.stringify({
          action: 'SYNC',
          messageId: messageId,
          data: change
        }));
        
        // Zaman aşımı
        setTimeout(() => {
          this.socket.removeEventListener('message', responseListener);
          reject(new Error('Senkronizasyon yanıtı zaman aşımına uğradı'));
        }, 10000); // 10 saniye
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Olay dinleyicisi ekleme
   */
  on(topic, callback) {
    if (!this.listeners[topic]) {
      this.listeners[topic] = [];
    }
    
    this.listeners[topic].push(callback);
    this.eventBus.on(`erp:${topic}`, callback);
    
    return () => this.off(topic, callback);
  }
  
  /**
   * Olay dinleyicisini kaldırma
   */
  off(topic, callback) {
    if (this.listeners[topic]) {
      this.listeners[topic] = this.listeners[topic].filter(cb => cb !== callback);
    }
    
    this.eventBus.off(`erp:${topic}`, callback);
  }
  
  /**
   * Servis temizleme
   */
  cleanup() {
    // Zamanlayıcıları temizle
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.publishQueueProcessor) clearInterval(this.publishQueueProcessor);
    
    // WebSocket bağlantısını kapat
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
    }
    
    // Dinleyicileri temizle
    Object.keys(this.listeners).forEach(topic => {
      this.listeners[topic].forEach(callback => {
        this.eventBus.off(`erp:${topic}`, callback);
      });
    });
    
    this.listeners = {};
    
    logger.info('ERP Servisi temizlendi');
  }

  // ==== MALZEME VE STOK YÖNETİMİ ====
  
  /**
   * Tüm malzemeleri getir
   */
  async getMaterials() {
    try {
      const response = await apiService.get('/erp/materials');
      return response.materials || [];
    } catch (error) {
      logger.error('ERP Malzeme verisi alınamadı:', error);
      
      // Çevrimdışı kullanım için veri döndür
      return this.getDemoMaterials();
    }
  }

  /**
   * Stok verilerini getir
   */
  async getStockData() {
    if (this.cachedStockData && !apiService.mockMode) {
      return this.cachedStockData;
    }

    try {
      const response = await apiService.get('/erp/stock');
      this.cachedStockData = response.stock || [];
      return this.cachedStockData;
    } catch (error) {
      logger.error('ERP Stok verisi alınamadı:', error);
      
      // Çevrimdışı kullanım için veri döndür
      this.cachedStockData = this.getDemoStockData();
      return this.cachedStockData;
    }
  }

  /**
   * Stok bilgilerini gerçek zamanlı güncelleme
   */
  async updateStockData(stockItem) {
    try {
      // Değişikliği yerel olarak kaydet
      const change = {
        id: `stock_${Date.now()}`,
        type: 'STOCK_UPDATE',
        timestamp: new Date().toISOString(),
        data: stockItem
      };
      
      pendingChanges.push(change);
      this.savePendingChanges();
      
      // Değişikliği yayınla (çevrimiçiyse)
      if (syncStatus.value === 'connected') {
        await this.publishChange(change);
      }
      
      // Önbelleği güncelle
      if (this.cachedStockData) {
        const index = this.cachedStockData.findIndex(item => item.code === stockItem.code);
        if (index !== -1) {
          this.cachedStockData[index] = { ...this.cachedStockData[index], ...stockItem };
        } else {
          this.cachedStockData.push(stockItem);
        }
      }
      
      // Event gönder
      this.eventBus.emit('erp:stock-updated', { item: stockItem });
      
      return { success: true };
    } catch (error) {
      logger.error('Stok verisi güncellenirken hata:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Malzeme durumunu kontrol et
   */
  async checkMaterialAvailability(materialCode) {
    try {
      const response = await apiService.get(`/erp/materials/${materialCode}/availability`);
      return response;
    } catch (error) {
      logger.error(`ERP Malzeme durumu alınamadı (${materialCode}):`, error);
      
      // API yanıt veremediğinde önbellekten kontrol et
      if (this.cachedStockData) {
        const stockItem = this.cachedStockData.find(item => item.code === materialCode);
        if (stockItem) {
          return {
            code: materialCode,
            available: stockItem.availableQuantity || 0,
            allocated: stockItem.allocatedQuantity || 0,
            status: stockItem.availableQuantity > 0 ? 'available' : 'unavailable'
          };
        }
      }
      
      return { code: materialCode, available: 0, status: 'error' };
    }
  }

  // ==== SİPARİŞ YÖNETİMİ ====
  
  /**
   * Tüm siparişleri getir
   */
  async getOrders() {
    try {
      const response = await apiService.get('/erp/orders');
      return response.orders || [];
    } catch (error) {
      logger.error('ERP Sipariş verisi alınamadı:', error);
      return this.getMockOrders();
    }
  }
  
  /**
   * Son n adet siparişi getir
   */
  async getRecentOrders(limit = 10) {
    try {
      const response = await apiService.get(`/erp/orders/recent?limit=${limit}`);
      return response.orders || [];
    } catch (error) {
      logger.error('Son siparişler alınamadı:', error);
      
      // Tüm siparişlerden son n tanesini döndür
      const allOrders = await this.getOrders();
      return allOrders.slice(0, limit);
    }
  }

  /**
   * Sipariş detaylarını getir
   */
  async getOrderDetails(orderNo) {
    try {
      const response = await apiService.get(`/erp/orders/${orderNo}`);
      return response.order;
    } catch (error) {
      logger.error(`ERP Sipariş detayları alınamadı (${orderNo}):`, error);
      return null;
    }
  }

  /**
   * Yeni sipariş oluştur
   */
  async createOrder(orderData) {
    try {
      // API çağrısı
      const response = await apiService.post('/erp/orders', orderData);
      
      // Değişikliği yerel olarak kaydet
      const change = {
        id: `order_create_${Date.now()}`,
        type: 'ORDER_CREATE',
        timestamp: new Date().toISOString(),
        data: {
          orderNo: response.orderNo,
          ...orderData
        }
      };
      
      pendingChanges.push(change);
      this.savePendingChanges();
      
      // Değişikliği yayınla (çevrimiçiyse)
      if (syncStatus.value === 'connected') {
        await this.publishChange(change);
      }
      
      // Event gönder
      this.eventBus.emit('erp:order-created', { orderNo: response.orderNo, order: orderData });
      
      return response;
    } catch (error) {
      logger.error('ERP Sipariş oluşturulamadı:', error);
      return { success: false, error: error.message || 'Sipariş oluşturulamadı' };
    }
  }
  
  /**
   * Sipariş güncelle
   */
  async updateOrder(orderNo, orderData) {
    try {
      // API çağrısı
      const response = await apiService.put(`/erp/orders/${orderNo}`, orderData);
      
      // Değişikliği yerel olarak kaydet
      const change = {
        id: `order_update_${Date.now()}`,
        type: 'ORDER_UPDATE',
        timestamp: new Date().toISOString(),
        data: {
          orderNo,
          ...orderData
        }
      };
      
      pendingChanges.push(change);
      this.savePendingChanges();
      
      // Değişikliği yayınla (çevrimiçiyse)
      if (syncStatus.value === 'connected') {
        await this.publishChange(change);
      }
      
      // Event gönder
      this.eventBus.emit('erp:order-updated', { orderNo, updates: orderData });
      
      return response;
    } catch (error) {
      logger.error(`ERP Sipariş güncellenemedi (${orderNo}):`, error);
      return { success: false, error: error.message || 'Sipariş güncellenemedi' };
    }
  }

  // ==== ÜRETİM YÖNETİMİ ====
  
  /**
   * Üretim durumunu getir
   */
  async getProductionStatus() {
    try {
      const response = await apiService.get('/erp/production');
      return response.production || {};
    } catch (error) {
      logger.error('ERP Üretim durumu alınamadı:', error);
      return this.getMockProductionStatus();
    }
  }
  
  /**
   * Üretim aşamasını güncelle
   */
  async updateProductionStatus(orderId, stageData) {
    try {
      // API çağrısı
      const response = await apiService.put(`/erp/production/${orderId}/status`, stageData);
      
      // Değişikliği yerel olarak kaydet
      const change = {
        id: `production_${Date.now()}`,
        type: 'PRODUCTION_UPDATE',
        timestamp: new Date().toISOString(),
        data: {
          orderId,
          stage: stageData.stage,
          status: stageData.status,
          completion: stageData.completion,
          notes: stageData.notes
        }
      };
      
      pendingChanges.push(change);
      this.savePendingChanges();
      
      // Değişikliği yayınla (çevrimiçiyse)
      if (syncStatus.value === 'connected') {
        await this.publishChange(change);
      }
      
      // Event gönder
      this.eventBus.emit('erp:production-updated', { 
        orderId, 
        stage: stageData.stage, 
        status: stageData.status,
        completion: stageData.completion
      });
      
      return response;
    } catch (error) {
      logger.error(`ERP Üretim durumu güncellenemedi (${orderId}):`, error);
      return { 
        success: false, 
        error: error.message || 'Üretim durumu güncellenemedi'
      };
    }
  }
  
  /**
   * Üretim operasyonlarını getir
   */
  async getProductionOperations(orderId) {
    try {
      const response = await apiService.get(`/erp/production/${orderId}/operations`);
      return response.operations || [];
    } catch (error) {
      logger.error(`ERP Üretim operasyonları alınamadı (${orderId}):`, error);
      return [];
    }
  }
  
  /**
   * Üretim operasyonu ekle
   */
  async addProductionOperation(orderId, operationData) {
    try {
      // API çağrısı
      const response = await apiService.post(`/erp/production/${orderId}/operations`, operationData);
      
      // Değişikliği yerel olarak kaydet
      const change = {
        id: `operation_add_${Date.now()}`,
        type: 'OPERATION_ADD',
        timestamp: new Date().toISOString(),
        data: {
          orderId,
          operation: operationData
        }
      };
      
      pendingChanges.push(change);
      this.savePendingChanges();
      
      // Değişikliği yayınla (çevrimiçiyse)
      if (syncStatus.value === 'connected') {
        await this.publishChange(change);
      }
      
      // Event gönder
      this.eventBus.emit('erp:operation-added', { 
        orderId, 
        operationId: response.operationId,
        operation: operationData
      });
      
      return response;
    } catch (error) {
      logger.error(`ERP Üretim operasyonu eklenemedi (${orderId}):`, error);
      return { 
        success: false, 
        error: error.message || 'Üretim operasyonu eklenemedi'
      };
    }
  }

  // ==== MALZEME REZERVASYONU ====
  
  /**
   * Sipariş için malzeme rezerve et
   */
  async reserveMaterialsForOrder(orderId, materials) {
    try {
      // API çağrısı
      const response = await apiService.post(`/erp/materials/reserve`, { orderId, materials });
      
      // Değişikliği yerel olarak kaydet
      const change = {
        id: `reserve_${Date.now()}`,
        type: 'MATERIAL_RESERVE',
        timestamp: new Date().toISOString(),
        data: {
          orderId,
          materials
        }
      };
      
      pendingChanges.push(change);
      this.savePendingChanges();
      
      // Değişikliği yayınla (çevrimiçiyse)
      if (syncStatus.value === 'connected') {
        await this.publishChange(change);
      }
      
      // Önbelleği güncelle
      if (this.cachedStockData) {
        materials.forEach(material => {
          const stockItem = this.cachedStockData.find(item => item.code === material.code);
          if (stockItem) {
            stockItem.allocatedQuantity = (stockItem.allocatedQuantity || 0) + material.quantity;
            stockItem.availableQuantity = stockItem.quantity - stockItem.allocatedQuantity;
          }
        });
      }
      
      // Event gönder
      this.eventBus.emit('erp:materials-reserved', { orderId, materials });
      
      return response;
    } catch (error) {
      logger.error(`ERP Malzeme rezervasyonu başarısız (${orderId}):`, error);
      return { success: false, error: error.message || 'Malzeme rezervasyonu yapılamadı' };
    }
  }
  
  /**
   * Malzeme rezervasyonunu iptal et
   */
  async cancelMaterialReservation(orderId, materials) {
    try {
      // API çağrısı
      const response = await apiService.post(`/erp/materials/cancel-reserve`, { orderId, materials });
      
      // Değişikliği yerel olarak kaydet
      const change = {
        id: `cancel_reserve_${Date.now()}`,
        type: 'MATERIAL_CANCEL_RESERVE',
        timestamp: new Date().toISOString(),
        data: {
          orderId,
          materials
        }
      };
      
      pendingChanges.push(change);
      this.savePendingChanges();
      
      // Değişikliği yayınla (çevrimiçiyse)
      if (syncStatus.value === 'connected') {
        await this.publishChange(change);
      }
      
      // Önbelleği güncelle
      if (this.cachedStockData) {
        materials.forEach(material => {
          const stockItem = this.cachedStockData.find(item => item.code === material.code);
          if (stockItem) {
            stockItem.allocatedQuantity = Math.max(0, (stockItem.allocatedQuantity || 0) - material.quantity);
            stockItem.availableQuantity = stockItem.quantity - stockItem.allocatedQuantity;
          }
        });
      }
      
      // Event gönder
      this.eventBus.emit('erp:material-reservation-canceled', { orderId, materials });
      
      return response;
    } catch (error) {
      logger.error(`ERP Malzeme rezervasyonu iptali başarısız (${orderId}):`, error);
      return { success: false, error: error.message || 'Malzeme rezervasyonu iptal edilemedi' };
    }
  }
  
  /**
   * Malzeme kullanımını kaydet (rezervasyonu tüket)
   */
  async consumeMaterials(orderId, materials) {
    try {
      // API çağrısı
      const response = await apiService.post(`/erp/materials/consume`, { orderId, materials });
      
      // Değişikliği yerel olarak kaydet
      const change = {
        id: `consume_${Date.now()}`,
        type: 'MATERIAL_CONSUME',
        timestamp: new Date().toISOString(),
        data: {
          orderId,
          materials
        }
      };
      
      pendingChanges.push(change);
      this.savePendingChanges();
      
      // Değişikliği yayınla (çevrimiçiyse)
      if (syncStatus.value === 'connected') {
        await this.publishChange(change);
      }
      
      // Önbelleği güncelle
      if (this.cachedStockData) {
        materials.forEach(material => {
          const stockItem = this.cachedStockData.find(item => item.code === material.code);
          if (stockItem) {
            stockItem.quantity = Math.max(0, stockItem.quantity - material.quantity);
            stockItem.allocatedQuantity = Math.max(0, (stockItem.allocatedQuantity || 0) - material.quantity);
            stockItem.availableQuantity = stockItem.quantity - stockItem.allocatedQuantity;
          }
        });
      }
      
      // Event gönder
      this.eventBus.emit('erp:materials-consumed', { orderId, materials });
      
      return response;
    } catch (error) {
      logger.error(`ERP Malzeme kullanımı başarısız (${orderId}):`, error);
      return { success: false, error: error.message || 'Malzeme kullanımı kaydedilemedi' };
    }
  }
  
  // ==== GENEL ERP FONKSİYONLARI ====
  
  /**
   * Bildirimleri getir
   */
  async getNotifications() {
    try {
      const response = await apiService.get('/erp/notifications');
      return response;
    } catch (error) {
      logger.error('ERP Bildirimleri alınamadı:', error);
      
      // Demo bildirimler
      return {
        success: true,
        data: [
          {
            id: 1,
            title: 'Sipariş Teslim Tarihi Gecikmesi',
            content: '#0424-1251 numaralı sipariş için mekanik montaj gecikmesi.',
            department: 'Mekanik Üretim',
            priority: 'high',
            type: 'warning',
            isRead: false,
            timestamp: new Date(Date.now() - 1 * 3600000)
          },
          {
            id: 2,
            title: 'Kritik Malzeme Stok Uyarısı',
            content: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC stok seviyesi kritik.',
            department: 'Satın Alma',
            priority: 'medium',
            type: 'warning',
            isRead: false,
            timestamp: new Date(Date.now() - 3 * 3600000)
          }
        ]
      };
    }
  }
  
  /**
   * Ana ERP panelinden veri çek (dashboard için)
   */
  async getDashboardData() {
    try {
      const response = await apiService.get('/erp/dashboard');
      return response;
    } catch (error) {
      logger.error('ERP Dashboard verisi alınamadı:', error);
      return {
        success: false,
        error: 'Dashboard verisi alınamadı'
      };
    }
  }
  
  /**
   * Senkronizasyon durumunu getir
   */
  getSyncStatus() {
    return {
      status: syncStatus.value,
      lastSync: lastSyncTime.value,
      pendingChanges: pendingChanges.length,
      errors: syncErrors.value
    };
  }

  // ==== DEMO VERİLER ====
  
  /**
   * Demo malzeme verileri
   */
  getDemoMaterials() {
    return [
      {
        code: '137998%',
        name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC',
        category: 'Relay',
        unit: 'Adet',
        price: 4250.00,
        supplier: 'Siemens',
        supplierCode: 'S-7SR1003',
        leadTime: 21
      },
      {
        code: '144866%',
        name: 'KAP-80/190-95 Akım Trafosu',
        category: 'Transformer',
        unit: 'Adet',
        price: 850.00,
        supplier: 'ABB',
        supplierCode: 'ABB-KAP80',
        leadTime: 14
      },
      {
        code: '157322%',
        name: 'Siemens 8DL5 Sekonder Kablo Seti',
        category: 'Cable',
        unit: 'Set',
        price: 1650.00,
        supplier: 'Siemens',
        supplierCode: 'S-8DL5-KBL',
        leadTime: 10
      }
    ];
  }

  /**
   * Demo stok verileri
   */
  getDemoStockData() {
    return [
      {
        code: '137998%',
        name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC',
        quantity: 2,
        availableQuantity: 2,
        allocatedQuantity: 0,
        minQuantity: 5,
        location: 'C5-B3'
      },
      {
        code: '144866%',
        name: 'KAP-80/190-95 Akım Trafosu',
        quantity: 3,
        availableQuantity: 1,
        allocatedQuantity: 2,
        minQuantity: 5,
        location: 'D2-A7'
      },
      {
        code: '157322%',
        name: 'Siemens 8DL5 Sekonder Kablo Seti',
        quantity: 0,
        availableQuantity: 0,
        allocatedQuantity: 0,
        minQuantity: 2,
        location: 'B8-C2'
      },
      {
        code: '119845%',
        name: 'LED Lamba Kiti (Kırmızı-Yeşil-Sarı) 24V',
        quantity: 5,
        availableQuantity: 5,
        allocatedQuantity: 0,
        minQuantity: 10,
        location: 'A3-D5'
      }
    ];
  }

  /**
   * Demo sipariş verileri
   */
  getMockOrders() {
    return [
      {
        id: '#0424-1251',
        customer: 'AYEDAŞ',
        cellType: 'RM 36 CB',
        quantity: 5,
        status: 'Üretimde',
        progress: 65,
        dueDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000)
      },
      {
        id: '#0424-1245',
        customer: 'TEİAŞ',
        cellType: 'RM 36 CB',
        quantity: 8,
        status: 'Üretimde',
        progress: 45,
        dueDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: '#0424-1239',
        customer: 'BEDAŞ',
        cellType: 'RM 36 LB',
        quantity: 3,
        status: 'Üretimde',
        progress: 30,
        dueDate: new Date(new Date().getTime() + 18 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  /**
   * Demo üretim durumu
   */
  getMockProductionStatus() {
    return {
      daily: {
        planned: 5,
        completed: 4,
        efficiency: 92
      },
      weekly: {
        planned: 24,
        completed: 21,
        efficiency: 87.5
      },
      issues: [
        "36kV kesici temininde gecikme",
        "A2 montaj hattında bakım yapılıyor"
      ],
      activeOrders: [
        {
          id: '#0424-1251',
          customer: 'AYEDAŞ',
          stage: 'İç Montaj',
          scheduledCompletion: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
          progress: 65
        },
        {
          id: '#0424-1245',
          customer: 'TEİAŞ',
          stage: 'Malzeme Hazırlık',
          scheduledCompletion: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000),
          progress: 45
        }
      ]
    };
  }
}

// Singleton instance oluştur ve export et
export const erpService = new ErpService();

/**
 * ERP Service composable fonksiyonu
 * @returns {Object} ERP Service instance
 */
export const useErpService = () => {
  // Eğer başlatılmamışsa başlat
  if (!erpService.initialized) {
    erpService.init();
  }
  
  return {
    ...erpService,
    syncStatus,
    lastSyncTime,
    pendingChanges,
    dataVersion,
    syncErrors
  };
};