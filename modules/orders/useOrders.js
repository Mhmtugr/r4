/**
 * useOrders.js
 * Siparişlerin listelenmesi ve filtrelenmesi için kompozisyon fonksiyonu
 */

import { ref, reactive, computed, watch } from 'vue';
import { useToast } from '@/composables/useToast';
import { aiService } from '@/services/ai-service';

export function useOrders() {
  // Dependencies
  const { showToast } = useToast();
  
  // State
  const orders = ref([]);
  const isLoading = ref(false);
  const totalOrderCount = ref(0);
  
  // Filtreleme ve sıralama state'i
  const filters = reactive({
    searchQuery: '',
    cellType: '',
    status: '',
    dateRange: {
      start: '',
      end: ''
    },
    priorityLevel: '',
    customerName: '',
    riskLevel: '' // Yeni eklenen risk seviyesi filtresi
  });
  
  const sorting = reactive({
    field: 'orderDate',
    direction: 'desc' // 'asc' veya 'desc'
  });
  
  const pagination = reactive({
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: computed(() => Math.ceil(filteredOrders.value.length / pagination.itemsPerPage))
  });
  
  // AI filtreleme state'i
  const isAiFiltering = ref(false);
  
  // Computed properties
  const filteredOrders = computed(() => {
    let result = [...orders.value];
    
    // Arama sorgusu filtresi - Doğal dil araması desteği
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      
      // Doğal dil araması için basit anahtar kelime kontrolü
      if (query.includes('geciken') || query.includes('gecikmiş')) {
        result = result.filter(order => order.status === 'delayed');
      } else if (query.includes('tamamlan') || query.includes('biten')) {
        result = result.filter(order => order.status === 'completed');
      } else if (query.includes('üretimde') || query.includes('devam eden')) {
        result = result.filter(order => order.status === 'in_progress');
      } else if (query.includes('yüksek öncelik') || query.includes('acil')) {
        result = result.filter(order => order.priority === 'high');
      } else if (query.includes('risk')) {
        result = result.filter(order => order.riskLevel === 'high');
      } else {
        // Geleneksel arama (terim bazlı)
        result = result.filter(order => 
          order.orderNo?.toLowerCase().includes(query) || 
          order.customerInfo?.name?.toLowerCase().includes(query) ||
          (order.cells && order.cells.some(cell => 
            cell.productTypeCode?.toLowerCase().includes(query)
          ))
        );
      }
      
      // Müşteri ismi özel kontrolü
      // Örn: "AYEDAŞ'ın siparişleri" gibi aramalar için
      const customerMatch = query.match(/([a-zA-ZşŞıİçÇöÖüÜğĞ]+)'[ıiuünña]n/i);
      if (customerMatch) {
        const customerName = customerMatch[1].toUpperCase();
        result = result.filter(order => 
          order.customerInfo?.name?.toUpperCase().includes(customerName)
        );
      }
    }
    
    // Hücre tipi filtresi
    if (filters.cellType) {
      result = result.filter(order => {
        if (!order.cells || !order.cells.length) return false;
        return order.cells.some(cell => 
          cell.productTypeCode?.includes(filters.cellType)
        );
      });
    }
    
    // Durum filtresi
    if (filters.status) {
      result = result.filter(order => order.status === filters.status);
    }
    
    // Tarih aralığı filtresi
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(order => {
        const orderDate = new Date(order.orderDate);
        
        if (filters.dateRange.start && filters.dateRange.end) {
          const start = new Date(filters.dateRange.start);
          const end = new Date(filters.dateRange.end);
          return orderDate >= start && orderDate <= end;
        } else if (filters.dateRange.start) {
          const start = new Date(filters.dateRange.start);
          return orderDate >= start;
        } else if (filters.dateRange.end) {
          const end = new Date(filters.dateRange.end);
          return orderDate <= end;
        }
        
        return true;
      });
    }
    
    // Öncelik seviyesi filtresi
    if (filters.priorityLevel) {
      result = result.filter(order => order.priority === filters.priorityLevel);
    }
    
    // Müşteri adı filtresi
    if (filters.customerName) {
      result = result.filter(order => 
        order.customerInfo?.name?.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }
    
    // Risk seviyesi filtresi
    if (filters.riskLevel) {
      result = result.filter(order => order.riskLevel === filters.riskLevel);
    }
    
    // Sıralama
    result.sort((a, b) => {
      let valA = getNestedValue(a, sorting.field);
      let valB = getNestedValue(b, sorting.field);
      
      // Tarih türünde değerler için
      if (sorting.field === 'orderDate' || 
          sorting.field === 'createdAt' || 
          sorting.field === 'updatedAt') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }
      
      if (sorting.direction === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
    
    return result;
  });
  
  const paginatedOrders = computed(() => {
    const startIdx = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIdx = startIdx + pagination.itemsPerPage;
    return filteredOrders.value.slice(startIdx, endIdx);
  });
  
  const customerList = computed(() => {
    // Benzersiz müşteri isimleri için
    const uniqueCustomers = new Set();
    
    orders.value.forEach(order => {
      if (order.customerInfo?.name) {
        uniqueCustomers.add(order.customerInfo.name);
      }
    });
    
    return Array.from(uniqueCustomers).sort();
  });
  
  const cellTypeList = computed(() => {
    // Benzersiz hücre tipleri için
    const uniqueCellTypes = new Set();
    
    orders.value.forEach(order => {
      if (order.cells && order.cells.length) {
        order.cells.forEach(cell => {
          if (cell.productTypeCode) {
            uniqueCellTypes.add(cell.productTypeCode);
          }
        });
      }
    });
    
    return Array.from(uniqueCellTypes).sort();
  });
  
  // İç yardımcı fonksiyonlar
  function getNestedValue(obj, path) {
    // "customerInfo.name" gibi nested alanlar için
    return path.split('.').reduce((o, p) => (o && o[p] !== undefined) ? o[p] : null, obj);
  }
  
  // Methods
  
  /**
   * Tüm siparişleri yükler
   * @returns {Promise<Array>} - Siparişler listesi
   */
  async function loadOrders() {
    try {
      isLoading.value = true;
      
      // Firebase kullanılabilirse
      if (window.firebase && window.firebase.firestore) {
        const snapshot = await window.firebase.firestore()
          .collection('orders')
          .orderBy('createdAt', 'desc')
          .get();
        
        const result = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          result.push({
            id: doc.id,
            ...data,
            // Timestamp'ları Date'e dönüştür
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
        
        orders.value = result;
        totalOrderCount.value = result.length;
        
        // Risk seviyelerini hesapla
        await calculateRiskLevels(result);
        
        return result;
      } else {
        // Demo mod
        const demoOrders = getDemoOrders();
        orders.value = demoOrders;
        totalOrderCount.value = demoOrders.length;
        
        // Demo risk seviyeleri
        await calculateRiskLevels(demoOrders);
        
        return demoOrders;
      }
    } catch (error) {
      console.error('Siparişler yüklenirken hata oluştu:', error);
      showToast('Siparişler yüklenemedi: ' + error.message, 'error');
      
      // Demo mod - hata durumunda
      const demoOrders = getDemoOrders();
      orders.value = demoOrders;
      totalOrderCount.value = demoOrders.length;
      
      return demoOrders;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * Siparişlerin risk seviyelerini hesaplar
   * @param {Array} orderList - Sipariş listesi
   * @returns {Promise<void>}
   */
  async function calculateRiskLevels(orderList) {
    // Gerçek uygulamada, AI servisiyle risk analizi yapılır
    // const riskAnalysis = await aiService.analyzeOrderRisks(orderList);
    
    // Demo için:
    for (const order of orderList) {
      // Gecikmiş siparişler otomatik olarak yüksek risk
      if (order.status === 'delayed') {
        order.riskLevel = 'high';
      } 
      // İlerlemesi düşük olan devam eden siparişler orta risk
      else if (order.status === 'in_progress' && order.progress < 40) {
        order.riskLevel = 'medium';
      }
      // Yüksek öncelikli ama henüz başlamayan siparişler orta risk
      else if (order.status === 'planned' && order.priority === 'high') {
        order.riskLevel = 'medium';
      }
      // Tamamlanmış siparişler düşük risk
      else if (order.status === 'completed') {
        order.riskLevel = 'low';
      }
      // Diğer siparişler için rastgele risk ataması (demo amaçlı)
      else {
        const risks = ['low', 'medium', 'low']; // Düşük riskin daha olası olması için
        const randomIndex = Math.floor(Math.random() * risks.length);
        order.riskLevel = risks[randomIndex];
      }
    }
  }
  
  /**
   * Yapay zeka ile filtreleri uygular
   * Doğal dil ile ifade edilen sorgu metinlerini filtrelere dönüştürür
   * @returns {Promise<void>}
   */
  async function applyAIFilters() {
    if (!filters.searchQuery) {
      showToast('Lütfen önce bir arama sorgusu girin', 'info');
      return;
    }
    
    try {
      isAiFiltering.value = true;
      
      // Gerçek uygulamada: AI servisine sorguyu gönder ve filtreleri al
      // const aiFilters = await aiService.parseFilterQuery(filters.searchQuery);
      
      // Demo için basit sorgu analizi:
      const query = filters.searchQuery.toLowerCase();
      
      // Filtreleri temizle
      clearFilters();
      
      // Demo filtre atamaları
      if (query.includes('gecik')) {
        filters.status = 'delayed';
      }
      
      if (query.includes('yüksek öncelik') || query.includes('acil')) {
        filters.priorityLevel = 'high';
      }
      
      if (query.includes('risk')) {
        filters.riskLevel = 'high';
      }
      
      // Müşteri ismi kontrolü
      const customerNames = customerList.value;
      for (const customerName of customerNames) {
        if (query.includes(customerName.toLowerCase())) {
          filters.customerName = customerName;
          break;
        }
      }
      
      // Hücre tipi kontrolü
      const cellTypes = cellTypeList.value;
      for (const cellType of cellTypes) {
        if (query.includes(cellType.toLowerCase())) {
          filters.cellType = cellType;
          break;
        }
      }
      
      showToast('AI filtreleri uygulandı', 'success');
      
      // Arama sorgusunu temizle - artık filtrelere dönüştürüldü
      filters.searchQuery = '';
      
    } catch (error) {
      console.error('AI filtresi uygulanırken hata oluştu:', error);
      showToast('AI filtresi uygulanamadı: ' + error.message, 'error');
    } finally {
      isAiFiltering.value = false;
    }
  }
  
  /**
   * Sonraki sayfaya geçer
   */
  function nextPage() {
    if (pagination.currentPage < pagination.totalPages) {
      pagination.currentPage++;
    }
  }
  
  /**
   * Önceki sayfaya geçer
   */
  function prevPage() {
    if (pagination.currentPage > 1) {
      pagination.currentPage--;
    }
  }
  
  /**
   * Belirtilen sayfaya gider
   * @param {number} page - Sayfa numarası
   */
  function goToPage(page) {
    if (page >= 1 && page <= pagination.totalPages) {
      pagination.currentPage = page;
    }
  }
  
  /**
   * Sıralama alanını değiştirir
   * @param {string} field - Sıralanacak alan adı
   */
  function sortBy(field) {
    // Aynı alan tekrar seçilirse yön değişir
    if (sorting.field === field) {
      sorting.direction = sorting.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sorting.field = field;
      sorting.direction = 'desc'; // Varsayılan sıralama yönü
    }
  }
  
  /**
   * Filtreleri temizler
   */
  function clearFilters() {
    Object.assign(filters, {
      searchQuery: '',
      cellType: '',
      status: '',
      dateRange: {
        start: '',
        end: ''
      },
      priorityLevel: '',
      customerName: '',
      riskLevel: ''
    });
  }
  
  /**
   * Durum metnini döndürür
   * @param {string} status - Durum kodu
   * @returns {string} - Durum metni
   */
  function getStatusText(status) {
    const statusMap = {
      'planned': 'Planlandı',
      'in_progress': 'Devam Ediyor',
      'delayed': 'Gecikiyor',
      'completed': 'Tamamlandı',
      'canceled': 'İptal Edildi'
    };
    
    return statusMap[status] || status;
  }
  
  /**
   * Durum badge sınıfını döndürür
   * @param {string} status - Durum kodu
   * @returns {string} - CSS sınıfı
   */
  function getStatusBadgeClass(status) {
    const classMap = {
      'planned': 'status-badge status-planned',
      'in_progress': 'status-badge status-progress',
      'delayed': 'status-badge status-delayed',
      'completed': 'status-badge status-completed',
      'canceled': 'status-badge status-canceled'
    };
    
    return classMap[status] || '';
  }
  
  /**
   * Demo siparişleri döndürür
   * @returns {Array} - Demo siparişler
   */
  function getDemoOrders() {
    return [
      {
        id: 'order-001',
        orderNo: '#0424-1251',
        orderDate: '2024-04-01',
        customerInfo: {
          name: 'AYEDAŞ',
          documentNo: 'PO-2024-A156',
          contactPerson: 'Ahmet Yılmaz'
        },
        cells: [
          {
            productTypeCode: 'RM 36 CB',
            technicalValues: '36kV 630A 16kA Kesicili ÇIKIŞ Hücresi',
            quantity: 1,
            deliveryDate: '2024-11-15'
          }
        ],
        status: 'delayed',
        progress: 65,
        priority: 'high',
        createdAt: new Date('2024-04-01'),
        updatedAt: new Date('2024-04-15')
      },
      {
        id: 'order-002',
        orderNo: '#0424-1245',
        orderDate: '2024-04-05',
        customerInfo: {
          name: 'BEDAŞ',
          documentNo: 'PO-2024-B789',
          contactPerson: 'Mehmet Demir'
        },
        cells: [
          {
            productTypeCode: 'RM 36 LB',
            technicalValues: '36kV 630A 16kA Yük Ayırıcılı Giriş Hücresi',
            quantity: 2,
            deliveryDate: '2024-11-20'
          },
          {
            productTypeCode: 'RM 36 CB',
            technicalValues: '36kV 630A 16kA Kesicili ÇIKIŞ Hücresi',
            quantity: 3,
            deliveryDate: '2024-11-20'
          }
        ],
        status: 'in_progress',
        progress: 35,
        priority: 'medium',
        createdAt: new Date('2024-04-05'),
        updatedAt: new Date('2024-04-10')
      },
      {
        id: 'order-003',
        orderNo: '#0424-1239',
        orderDate: '2024-04-08',
        customerInfo: {
          name: 'TOROSLAR EDAŞ',
          documentNo: 'PO-2024-T321',
          contactPerson: 'Zeynep Kaya'
        },
        cells: [
          {
            productTypeCode: 'RM 36 FL',
            technicalValues: '36kV 200A 16kA Sigortalı Yük Ayırıcılı TR.Koruma Hücresi',
            quantity: 2,
            deliveryDate: '2024-12-05'
          }
        ],
        status: 'planned',
        progress: 10,
        priority: 'low',
        createdAt: new Date('2024-04-08'),
        updatedAt: new Date('2024-04-08')
      },
      {
        id: 'order-004',
        orderNo: '#0424-1233',
        orderDate: '2024-03-25',
        customerInfo: {
          name: 'ENERJİSA',
          documentNo: 'PO-2024-E456',
          contactPerson: 'Can Demir'
        },
        cells: [
          {
            productTypeCode: 'RM 36 LB',
            technicalValues: '36kV 630A 16kA Yük Ayırıcılı Giriş Hücresi',
            quantity: 1,
            deliveryDate: '2024-12-05'
          }
        ],
        status: 'completed',
        progress: 100,
        priority: 'medium',
        createdAt: new Date('2024-03-25'),
        updatedAt: new Date('2024-04-17')
      },
      {
        id: 'order-005',
        orderNo: '#0424-1220',
        orderDate: '2024-03-15',
        customerInfo: {
          name: 'OSMANİYE ELEKTRİK',
          documentNo: 'PO-2024-O789',
          contactPerson: 'Ali Yıldız'
        },
        cells: [
          {
            productTypeCode: 'RM 36 FL',
            technicalValues: '36kV 200A 16kA Sigortalı Yük Ayırıcılı TR.Koruma Hücresi',
            quantity: 1,
            deliveryDate: '2024-10-30'
          }
        ],
        status: 'planned',
        progress: 5,
        priority: 'low',
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15')
      },
      {
        id: 'order-006',
        orderNo: '#0424-1219',
        orderDate: '2024-03-14',
        customerInfo: {
          name: 'AYEDAŞ',
          documentNo: 'PO-2024-A157',
          contactPerson: 'Ahmet Yılmaz'
        },
        cells: [
          {
            productTypeCode: 'RM 36 CB',
            technicalValues: '36kV 630A 16kA Kesicili ÇIKIŞ Hücresi',
            quantity: 2,
            deliveryDate: '2024-10-20'
          },
          {
            productTypeCode: 'RM 36 FL',
            technicalValues: '36kV 200A 16kA Sigortalı Yük Ayırıcılı TR.Koruma Hücresi',
            quantity: 1,
            deliveryDate: '2024-10-20'
          }
        ],
        status: 'in_progress',
        progress: 75,
        priority: 'high',
        createdAt: new Date('2024-03-14'),
        updatedAt: new Date('2024-04-20')
      },
      {
        id: 'order-007',
        orderNo: '#0424-1215',
        orderDate: '2024-03-10',
        customerInfo: {
          name: 'ÇORUH EDAŞ',
          documentNo: 'PO-2024-C123',
          contactPerson: 'Selin Çelik'
        },
        cells: [
          {
            productTypeCode: 'RM 36 LB',
            technicalValues: '36kV 630A 16kA Yük Ayırıcılı Giriş Hücresi',
            quantity: 3,
            deliveryDate: '2024-09-30'
          }
        ],
        status: 'delayed',
        progress: 45,
        priority: 'medium',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-04-18')
      }
    ];
  }
  
  // Liste filtreleri değiştiğinde sayfa numarasını sıfırla
  watch([
    () => filters.searchQuery, 
    () => filters.cellType, 
    () => filters.status, 
    () => filters.dateRange.start, 
    () => filters.dateRange.end,
    () => filters.priorityLevel,
    () => filters.customerName,
    () => filters.riskLevel
  ], () => {
    pagination.currentPage = 1;
  });
  
  // Return public API
  return {
    // State
    orders,
    isLoading,
    totalOrderCount,
    filters,
    sorting,
    pagination,
    isAiFiltering,
    
    // Computed
    filteredOrders,
    paginatedOrders,
    customerList,
    cellTypeList,
    
    // Methods
    loadOrders,
    nextPage,
    prevPage,
    goToPage,
    sortBy,
    clearFilters,
    getStatusText,
    getStatusBadgeClass,
    applyAIFilters
  };
}