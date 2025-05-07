/**
 * usePlanningService.js
 * Üretim planlama ve kapasite yönetimi için servis fonksiyonları
 */

import { ref, reactive, watchEffect, onUnmounted } from 'vue';
import { apiService } from '@/services/api-service';
import { useToast } from '@/composables/useToast';

export function usePlanningService() {
  const { toast } = useToast();
  
  // Gerçek zamanlı üretim durumu state'i
  const productionStatus = reactive({
    isMonitoring: false,
    lastUpdated: null,
    activeUnits: [],
    machineStatuses: {},
    productionLines: [],
    bottlenecks: [],
    efficiencyMetrics: {},
    alerts: [],
    connectionStatus: 'disconnected'
  });
  
  // WebSocket bağlantısı
  let productionSocket = null;
  let heartbeatInterval = null;
  let reconnectTimeout = null;
  let reconnectAttempts = 0;

  // Demo üretim birimleri ve kapasiteleri
  const demoProductionUnits = [
    { id: 'elektrik_tasarim', name: 'Elektrik Tasarım', capacity: 160 },
    { id: 'mekanik_tasarim', name: 'Mekanik Tasarım', capacity: 120 },
    { id: 'satin_alma', name: 'Satın Alma', capacity: 80 },
    { id: 'mekanik_uretim', name: 'Mekanik Üretim', capacity: 200 },
    { id: 'ic_montaj', name: 'İç Montaj', capacity: 240 },
    { id: 'kablaj', name: 'Kablaj', capacity: 320 },
    { id: 'genel_montaj', name: 'Genel Montaj', capacity: 280 },
    { id: 'test', name: 'Test', capacity: 160 }
  ];

  // Demo siparişler
  const demoOrders = [
    { id: 'SPR-2025-001', orderId: 'SPR-2025-001', customerName: 'İBB Elektrik', cellType: 'RM 36 CB', quantity: 2, status: 'production', priority: 'high' },
    { id: 'SPR-2025-002', orderId: 'SPR-2025-002', customerName: 'Antalya Belediyesi', cellType: 'RM 36 LB', quantity: 5, status: 'production', priority: 'medium' },
    { id: 'SPR-2025-003', orderId: 'SPR-2025-003', customerName: 'TEDAŞ Ankara', cellType: 'RM 36 FL', quantity: 3, status: 'pending', priority: 'medium' },
    { id: 'SPR-2025-004', orderId: 'SPR-2025-004', customerName: 'Bursa Enerji', cellType: 'RM 36 MB', quantity: 1, status: 'production', priority: 'high' },
    { id: 'SPR-2025-005', orderId: 'SPR-2025-005', customerName: 'İzmir Elektrik', cellType: 'RM 36 CB', quantity: 4, status: 'approved', priority: 'low' }
  ];
  
  /**
   * Gerçek zamanlı üretim izleme sistemini başlat
   * @param {Object} options İzleme seçenekleri
   * @returns {Object} İzleme durumu
   */
  const startProductionMonitoring = async (options = {}) => {
    try {
      if (productionStatus.isMonitoring) {
        return productionStatus;
      }
      
      productionStatus.isMonitoring = true;
      
      // Gerçek uygulamada WebSocket bağlantısı burada kurulacak
      // productionSocket = new WebSocket(apiService.getWebSocketUrl('/production-monitoring'));
      
      // Demo için simüle edilmiş gerçek zamanlı veri akışı başlat
      await initializeDemoMonitoring();
      startDemoDataStream();
      
      return productionStatus;
    } catch (error) {
      console.error('Üretim izleme başlatılamadı:', error);
      productionStatus.isMonitoring = false;
      productionStatus.connectionStatus = 'error';
      productionStatus.alerts.push({
        id: Date.now(),
        type: 'error',
        message: 'Üretim izleme sistemine bağlanılamadı',
        timestamp: new Date()
      });
      
      return productionStatus;
    }
  };
  
  /**
   * Gerçek zamanlı izlemeyi durdur
   */
  const stopProductionMonitoring = () => {
    productionStatus.isMonitoring = false;
    productionStatus.connectionStatus = 'disconnected';
    
    // WebSocket bağlantısını kapat
    if (productionSocket) {
      productionSocket.close();
      productionSocket = null;
    }
    
    // Zamanlayıcıları temizle
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    return productionStatus;
  };
  
  /**
   * Demo için izleme başlangıç verilerini oluştur
   */
  const initializeDemoMonitoring = async () => {
    // Bağlantı simülasyonu için kısa bir gecikme
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Aktif üretim birimleri
    productionStatus.activeUnits = demoProductionUnits.map(unit => ({
      id: unit.id,
      name: unit.name,
      status: Math.random() > 0.2 ? 'active' : (Math.random() > 0.5 ? 'idle' : 'maintenance'),
      efficiency: Math.floor(70 + Math.random() * 30), // 70-100% arası
      utilization: Math.floor(60 + Math.random() * 40), // 60-100% arası
      currentOrder: Math.random() > 0.3 ? demoOrders[Math.floor(Math.random() * demoOrders.length)].orderId : null
    }));
    
    // Makine durumları
    const machineStatuses = {};
    ['CNC-001', 'PRESS-002', 'BEND-001', 'WELD-003', 'ASSM-001', 'ASSM-002', 'TEST-001'].forEach(machineId => {
      machineStatuses[machineId] = {
        id: machineId,
        name: `${machineId} ${machineId.split('-')[0]}`,
        status: Math.random() > 0.15 ? 'running' : (Math.random() > 0.5 ? 'idle' : 'maintenance'),
        efficiency: Math.floor(65 + Math.random() * 35),
        lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Son 30 gün içinde
        currentTask: Math.random() > 0.2 ? `Task-${Math.floor(Math.random() * 100)}` : null,
        alerts: Math.random() > 0.8 ? [{
          type: 'warning',
          message: 'Bakım zamanı yaklaşıyor',
          timestamp: new Date()
        }] : []
      };
    });
    productionStatus.machineStatuses = machineStatuses;
    
    // Üretim hatları
    productionStatus.productionLines = [
      {
        id: 'line-1',
        name: 'Ana Montaj Hattı',
        status: 'active',
        efficiency: 87,
        currentOrder: 'SPR-2025-001',
        completionPercentage: 68,
        estimatedCompletion: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 saat sonra
        workers: 5,
        bottlenecks: []
      },
      {
        id: 'line-2',
        name: 'Kesici Montaj Hattı',
        status: 'active',
        efficiency: 92,
        currentOrder: 'SPR-2025-002',
        completionPercentage: 45,
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 saat sonra
        workers: 3,
        bottlenecks: []
      },
      {
        id: 'line-3',
        name: 'Hücre Test Hattı',
        status: 'idle',
        efficiency: 75,
        currentOrder: null,
        completionPercentage: 0,
        estimatedCompletion: null,
        workers: 2,
        bottlenecks: []
      }
    ];
    
    // Darboğazlar
    productionStatus.bottlenecks = [
      {
        id: 'bottleneck-1',
        location: 'Ana Montaj Hattı - İstasyon 3',
        impact: 'high',
        reason: 'Malzeme bekleniyor',
        affectedOrders: ['SPR-2025-001'],
        estimatedResolution: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 saat sonra
      }
    ];
    
    // Verimlilik metrikleri
    productionStatus.efficiencyMetrics = {
      overallEquipmentEffectiveness: 83.5,
      planAttainment: 91.2,
      productionRate: 5.2, // saat başına ünite
      qualityRate: 98.7,
      meanTimeToRepair: 47, // dakika
      meanTimeBetweenFailures: 168, // saat
      energyEfficiency: 88.3,
      laborEfficiency: 92.1
    };
    
    // Bağlantı durumu güncelle
    productionStatus.connectionStatus = 'connected';
    productionStatus.lastUpdated = new Date();
    
    return productionStatus;
  };
  
  /**
   * Demo için gerçek zamanlı veri akışı simülasyonu
   */
  const startDemoDataStream = () => {
    // Gerçek zamanlı veri güncellemeleri için interval
    heartbeatInterval = setInterval(() => {
      if (!productionStatus.isMonitoring) {
        clearInterval(heartbeatInterval);
        return;
      }
      
      // Makine durumlarını rastgele güncelle
      Object.keys(productionStatus.machineStatuses).forEach(machineId => {
        // %10 ihtimalle durum değişikliği
        if (Math.random() < 0.1) {
          productionStatus.machineStatuses[machineId].status = 
            Math.random() > 0.15 ? 'running' : (Math.random() > 0.5 ? 'idle' : 'maintenance');
          
          // Durum değişikliğine bağlı olarak alert oluştur
          if (productionStatus.machineStatuses[machineId].status === 'maintenance') {
            productionStatus.alerts.push({
              id: Date.now(),
              type: 'warning',
              message: `${productionStatus.machineStatuses[machineId].name} bakım moduna geçti`,
              timestamp: new Date(),
              machineId
            });
          }
        }
        
        // Verimlilik değişimi
        productionStatus.machineStatuses[machineId].efficiency += Math.random() < 0.5 ? -1 : 1;
        // Sınırlar içinde tut
        productionStatus.machineStatuses[machineId].efficiency = Math.max(60, Math.min(100, 
          productionStatus.machineStatuses[machineId].efficiency));
      });
      
      // Üretim hatlarını güncelle
      productionStatus.productionLines.forEach(line => {
        if (line.status === 'active') {
          // Tamamlanma yüzdesini güncelle
          line.completionPercentage += Math.random() * 2; // Her güncellemede %0-2 arası ilerleme
          if (line.completionPercentage >= 100) {
            line.completionPercentage = 100;
            line.status = 'completed';
            
            // Yeni bir sipariş al
            const availableOrders = demoOrders.filter(o => o.status === 'approved');
            if (availableOrders.length > 0) {
              const nextOrder = availableOrders[Math.floor(Math.random() * availableOrders.length)];
              line.currentOrder = nextOrder.orderId;
              line.completionPercentage = 0;
              line.status = 'active';
              line.estimatedCompletion = new Date(Date.now() + (4 + Math.random() * 4) * 60 * 60 * 1000);
            } else {
              line.currentOrder = null;
              line.status = 'idle';
              line.estimatedCompletion = null;
            }
          }
          
          // Verimlilik değişimi
          line.efficiency += (Math.random() < 0.5 ? -1 : 1) * Math.random() * 2;
          line.efficiency = Math.max(60, Math.min(100, line.efficiency));
        } else if (line.status === 'idle' && Math.random() < 0.2) {
          // Boşta olan hat için yeni sipariş alma olasılığı
          const availableOrders = demoOrders.filter(o => o.status === 'approved');
          if (availableOrders.length > 0) {
            const nextOrder = availableOrders[Math.floor(Math.random() * availableOrders.length)];
            line.currentOrder = nextOrder.orderId;
            line.completionPercentage = 0;
            line.status = 'active';
            line.estimatedCompletion = new Date(Date.now() + (4 + Math.random() * 4) * 60 * 60 * 1000);
          }
        }
      });
      
      // Darboğazları güncelle
      if (Math.random() < 0.2 && productionStatus.bottlenecks.length > 0) {
        // %20 ihtimalle bir darboğazı çöz
        const resolvedBottleneck = productionStatus.bottlenecks.shift();
        
        productionStatus.alerts.push({
          id: Date.now(),
          type: 'info',
          message: `Darboğaz çözüldü: ${resolvedBottleneck.location}`,
          timestamp: new Date()
        });
      }
      
      if (Math.random() < 0.1 && productionStatus.bottlenecks.length < 3) {
        // %10 ihtimalle yeni bir darboğaz ekle
        const locations = [
          'Ana Montaj Hattı - İstasyon 2', 
          'Kesici Montaj Hattı - İstasyon 1', 
          'Hücre Test Hattı - Hazırlık'
        ];
        
        const reasons = [
          'Malzeme bekleniyor', 
          'Teknik arıza', 
          'Personel eksikliği', 
          'Kalite sorunu'
        ];
        
        const newBottleneck = {
          id: `bottleneck-${Date.now()}`,
          location: locations[Math.floor(Math.random() * locations.length)],
          impact: Math.random() < 0.3 ? 'high' : (Math.random() < 0.6 ? 'medium' : 'low'),
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          affectedOrders: [demoOrders[Math.floor(Math.random() * demoOrders.length)].orderId],
          estimatedResolution: new Date(Date.now() + Math.random() * 4 * 60 * 60 * 1000)
        };
        
        productionStatus.bottlenecks.push(newBottleneck);
        
        productionStatus.alerts.push({
          id: Date.now(),
          type: 'warning',
          message: `Yeni darboğaz: ${newBottleneck.location} - ${newBottleneck.reason}`,
          timestamp: new Date()
        });
      }
      
      // Verimlilik metriklerini güncelle
      Object.keys(productionStatus.efficiencyMetrics).forEach(metric => {
        productionStatus.efficiencyMetrics[metric] += (Math.random() < 0.5 ? -1 : 1) * Math.random();
        // Sınırlar içinde tut
        productionStatus.efficiencyMetrics[metric] = Math.max(60, Math.min(99.9, 
          productionStatus.efficiencyMetrics[metric]));
      });
      
      // Alert sayısını kontrol et, çok fazla birikmesin
      if (productionStatus.alerts.length > 50) {
        productionStatus.alerts = productionStatus.alerts.slice(-50);
      }
      
      // Son güncelleme zamanını güncelle
      productionStatus.lastUpdated = new Date();
      
    }, 10000); // 10 saniyede bir güncelle
    
    return productionStatus;
  };

  /**
   * Planlama verileri yükle (siparişler, kapasite bilgileri vb.)
   */
  const getPlanningData = async () => {
    try {
      // Gerçek uygulamada API çağrıları yapılacak
      // const [orders, productionUnits] = await Promise.all([
      //   apiService.get('/orders?status=active'),
      //   apiService.get('/production-units')
      // ]);

      // Demo veriler için gecikme ekleyelim
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo siparişleri kullan
      const orders = [...demoOrders];
      
      // Schedule oluştur
      const schedule = await generateSchedule(orders);
      
      // Kapasite yükünü hesapla
      const capacityLoad = calculateCapacityLoad(schedule);
      
      // Teslimat tahminlerini oluştur
      const deliveryEstimates = generateDeliveryEstimates(schedule);

      return {
        orders,
        productionUnits: demoProductionUnits,
        schedule,
        capacityLoad,
        deliveryEstimates
      };
    } catch (error) {
      console.error('Planlama verileri yüklenirken hata:', error);
      throw new Error('Planlama verileri yüklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  /**
   * Bir sipariş için tahmini üretim süresini hesaplar (Demo Kural Bazlı)
   * @param {object} order Sipariş objesi
   * @returns {number} Tahmini süre (saat cinsinden)
   */
  const estimateProductionTime = (order) => {
    let estimatedHours = 0;
    const quantity = order.quantity || 1;
    const cellType = order.cellType || 'unknown';

    // Basit kural tabanlı tahmin
    switch (cellType.toLowerCase()) {
      case 'rm 36 cb': estimatedHours = 10; break;
      case 'rm 36 lb': estimatedHours = 12; break;
      case 'rm 36 fl': estimatedHours = 15; break;
      case 'rm 36 mb': estimatedHours = 18; break;
      default: estimatedHours = 8; // Bilinmeyen tip için varsayılan
    }

    // Miktar ile çarp
    estimatedHours *= quantity;

    return Math.max(1, estimatedHours); // Minimum 1 saat
  };

  /**
   * Siparişlere göre bir üretim zaman çizelgesi oluşturur
   * @param {Array<object>} orders Sipariş listesi
   * @returns {Promise<Array<object>>} Zaman çizelgesi öğeleri
   */
  const generateSchedule = async (orders) => {
    let schedule = [];
    let currentTime = new Date(); // Başlangıç zamanı
    currentTime.setHours(8, 0, 0, 0); // Çalışma saati başlangıcı

    // Basit sıralı planlama (FIFO)
    for (const order of orders) {
      const durationHours = estimateProductionTime(order);
      const durationMillis = durationHours * 60 * 60 * 1000;

      let startTime = new Date(currentTime);
      let endTime = new Date(currentTime.getTime() + durationMillis);

      // Hafta sonu kontrolü
      if (endTime.getDay() === 6) { // Cumartesi
        endTime.setDate(endTime.getDate() + 2); // Pazartesiye atla
        endTime.setHours(8, 0, 0, 0);
      } else if (endTime.getDay() === 0) { // Pazar
        endTime.setDate(endTime.getDate() + 1); // Pazartesiye atla
        endTime.setHours(8, 0, 0, 0);
      }

      // Kaynakları siparişin özelliklerine göre ata (demo için basit atama)
      const resourceId = order.cellType?.includes('CB') 
        ? 'elektrik_tasarim' 
        : order.cellType?.includes('LB') 
          ? 'mekanik_tasarim' 
          : 'genel_montaj';

      schedule.push({
        id: `task-${order.orderId || order.id}`,
        orderId: order.orderId || order.id,
        taskName: `Sipariş: ${order.orderId || order.id} (${order.cellType || 'N/A'})`,
        start: startTime,
        end: endTime,
        resourceId: resourceId
      });

      currentTime = new Date(endTime); // Bir sonraki görev bu görevin bitiminde başlar
    }
    return schedule;
  };

  /**
   * Zaman çizelgesine göre birimlerin kapasite yükünü hesaplar
   * @param {Array<object>} schedule Zaman çizelgesi
   * @returns {object} Birim ID'si başına yüklenen saatleri içeren obje
   */
  const calculateCapacityLoad = (schedule) => {
    const load = {};
    demoProductionUnits.forEach(unit => load[unit.id] = 0); // Başlangıç yükleri

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    schedule.forEach(task => {
      // Bu hafta içinde olan görevlerin yükünü hesapla
      if (task.start < nextWeek && task.end > now) {
        const resource = task.resourceId || 'genel_montaj';
        const durationHours = (task.end - task.start) / (1000 * 60 * 60);
        if (load[resource] !== undefined) {
          load[resource] += durationHours;
        } else {
          load['genel_montaj'] += durationHours;
        }
      }
    });
    return load;
  };

  /**
   * Zaman çizelgesine göre tahmini teslimatları oluşturur
   * @param {Array<object>} schedule Zaman çizelgesi
   * @returns {Array<object>} Teslimat tahminleri
   */
  const generateDeliveryEstimates = (schedule) => {
    return schedule.map(task => ({
      orderId: task.orderId,
      estimatedDeliveryDate: task.end
    }));
  };

  /**
   * Planlama parametrelerini güncelle (kapasiteler, öncelikler vb)
   * @param {Object} params Güncellenecek parametreler
   */
  const updatePlanningParameters = async (params) => {
    try {
      // Gerçek uygulamada API çağrısı yapılacak
      // return await apiService.post('/planning/parameters', params);
      
      // Demo için gecikme ekleyelim
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success("Planlama parametreleri güncellendi");
      return { success: true, message: "Parametreler güncellendi" };
    } catch (error) {
      console.error('Parametreler güncellenirken hata:', error);
      toast.error("Parametreler güncellenemedi");
      throw new Error('Parametreler güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };
  
  /**
   * Üretim simülasyonu verileri güncelle
   * @param {Object} updates - Güncelleme parametreleri
   */
  const updateSimulationData = (updates = {}) => {
    if (updates.efficiency) {
      // Verimlilik ayarını güncelle
      productionStatus.productionLines.forEach(line => {
        line.efficiency = Math.min(100, line.efficiency + updates.efficiency);
      });
      
      Object.keys(productionStatus.machineStatuses).forEach(machineId => {
        productionStatus.machineStatuses[machineId].efficiency = 
          Math.min(100, productionStatus.machineStatuses[machineId].efficiency + updates.efficiency);
      });
    }
    
    if (updates.bottlenecks === false && productionStatus.bottlenecks.length > 0) {
      // Tüm darboğazları kaldır
      productionStatus.alerts.push({
        id: Date.now(),
        type: 'info',
        message: `${productionStatus.bottlenecks.length} darboğaz çözüldü`,
        timestamp: new Date()
      });
      
      productionStatus.bottlenecks = [];
    }
    
    if (updates.addWorkers && updates.addWorkers > 0) {
      // İşçi ekle
      productionStatus.productionLines.forEach(line => {
        line.workers += updates.addWorkers;
        line.efficiency = Math.min(100, line.efficiency + (updates.addWorkers * 3));
      });
      
      productionStatus.alerts.push({
        id: Date.now(),
        type: 'info',
        message: `${updates.addWorkers} işçi üretim hatlarına eklendi`,
        timestamp: new Date()
      });
    }
    
    return productionStatus;
  };
  
  /**
   * Özel bir makine için durum güncellemesi
   * @param {string} machineId - Makine ID'si
   * @param {string} status - Yeni durum
   * @param {Object} details - Ek detaylar
   */
  const updateMachineStatus = (machineId, status, details = {}) => {
    if (!productionStatus.machineStatuses[machineId]) {
      return { success: false, message: 'Makine bulunamadı' };
    }
    
    // Makine durumunu güncelle
    const oldStatus = productionStatus.machineStatuses[machineId].status;
    productionStatus.machineStatuses[machineId].status = status;
    
    // Ek detayları ekle
    if (details.notes) {
      productionStatus.machineStatuses[machineId].notes = details.notes;
    }
    
    if (details.maintenanceDate) {
      productionStatus.machineStatuses[machineId].lastMaintenance = new Date(details.maintenanceDate);
    }
    
    // Bildirim oluştur
    productionStatus.alerts.push({
      id: Date.now(),
      type: 'info',
      message: `${productionStatus.machineStatuses[machineId].name} durumu ${oldStatus}'dan ${status}'a değiştirildi`,
      timestamp: new Date(),
      machineId,
      details
    });
    
    return { 
      success: true, 
      message: 'Makine durumu güncellendi',
      machineStatus: productionStatus.machineStatuses[machineId]
    };
  };
  
  /**
   * Hata yönetimi - Makine bakım isteği gönder
   * @param {string} machineId - Makine ID'si
   * @param {string} reason - Bakım nedeni
   */
  const requestMaintenance = async (machineId, reason) => {
    try {
      if (!productionStatus.machineStatuses[machineId]) {
        throw new Error('Makine bulunamadı');
      }
      
      // Gerçek uygulamada API isteği
      // await apiService.post('/maintenance/request', { machineId, reason });
      
      // Demo için gecikme
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Makine durumunu güncelle
      productionStatus.machineStatuses[machineId].status = 'maintenance_scheduled';
      productionStatus.machineStatuses[machineId].maintenanceReason = reason;
      productionStatus.machineStatuses[machineId].maintenanceScheduled = new Date(Date.now() + 4 * 60 * 60 * 1000);
      
      // Bildirim oluştur
      productionStatus.alerts.push({
        id: Date.now(),
        type: 'info',
        message: `${productionStatus.machineStatuses[machineId].name} için bakım talebi oluşturuldu`,
        timestamp: new Date(),
        machineId,
        reason
      });
      
      toast.success('Bakım talebi oluşturuldu');
      return {
        success: true,
        message: 'Bakım talebi başarıyla oluşturuldu',
        scheduledDate: productionStatus.machineStatuses[machineId].maintenanceScheduled
      };
    } catch (error) {
      console.error('Bakım talebi oluşturulurken hata:', error);
      toast.error('Bakım talebi oluşturulamadı');
      throw new Error('Bakım talebi oluşturulamadı: ' + (error.message || 'Bilinmeyen hata'));
    }
  };
  
  /**
   * Üretim raporları al
   * @param {string} reportType - Rapor tipi
   * @param {Object} filters - Filtreler
   */
  const getProductionReport = async (reportType = 'efficiency', filters = {}) => {
    try {
      // Demo için gecikme
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Demo için rapor verisi oluştur
      let report = {
        type: reportType,
        generatedAt: new Date(),
        filters,
        data: []
      };
      
      // Rapor tipine göre demo veri oluştur
      switch (reportType) {
        case 'efficiency':
          report.data = [
            { date: '2023-01-01', value: 82.5 },
            { date: '2023-01-02', value: 84.2 },
            { date: '2023-01-03', value: 81.7 },
            { date: '2023-01-04', value: 85.3 },
            { date: '2023-01-05', value: 86.1 },
            { date: '2023-01-06', value: 83.9 },
            { date: '2023-01-07', value: 84.8 }
          ];
          break;
          
        case 'bottlenecks':
          report.data = [
            { location: 'Ana Montaj Hattı - İstasyon 3', count: 12, averageResolutionTime: 124 },
            { location: 'Kesici Montaj Hattı - İstasyon 1', count: 8, averageResolutionTime: 97 },
            { location: 'Test Hattı', count: 5, averageResolutionTime: 62 },
            { location: 'Kablaj İstasyonu', count: 4, averageResolutionTime: 78 }
          ];
          break;
          
        case 'production_volume':
          report.data = [
            { product: 'RM 36 CB', quantity: 32, hours: 320 },
            { product: 'RM 36 LB', quantity: 28, hours: 336 },
            { product: 'RM 36 FL', quantity: 15, hours: 225 },
            { product: 'RM 36 MB', quantity: 8, hours: 144 }
          ];
          break;
          
        default:
          report.data = [];
      }
      
      return report;
    } catch (error) {
      console.error('Üretim raporu alınamadı:', error);
      throw new Error('Üretim raporu alınamadı: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Component unmount olduğunda bağlantıyı kapat
  onUnmounted(() => {
    stopProductionMonitoring();
  });

  // Dışa aktarılan fonksiyonlar
  return {
    getPlanningData,
    estimateProductionTime,
    updatePlanningParameters,
    startProductionMonitoring,
    stopProductionMonitoring,
    productionStatus,
    updateSimulationData,
    updateMachineStatus,
    requestMaintenance,
    getProductionReport
  };
}