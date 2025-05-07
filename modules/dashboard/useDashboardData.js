import { ref } from 'vue'
import { apiService } from '@/services/api-service'

/**
 * Dashboard veri servisi
 * Dashboard için gerekli verileri sağlar ve ERP entegrasyonu yapar
 * @returns {Object} Dashboard veri ve metodları
 */
export function useDashboardData() {
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * Dashboard verilerini tek bir çağrıda getirir
   * Bu fonksiyon Canias ERP sisteminden veri çekme işlemini simüle eder
   */
  const getDashboardData = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek uygulamada bu kısım API çağrıları ile değiştirilecek
      // const response = await apiService.get('/api/dashboard/summary')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 600))
      
      return {
        activeOrders: 24,
        ongoingProduction: 18,
        delayedOrders: 3,
        completedOrders: 42,
        ordersTrend: Math.random() > 0.5 ? 5.2 : -2.3,
        productionTrend: Math.random() > 0.5 ? 4.7 : -2.1,
        delayedTrend: Math.random() > 0.5 ? 1.5 : -1.8,
        completedTrend: Math.random() > 0.5 ? 8.7 : -3.4,
        criticalMaterials: [
          { code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', stock: 2, required: 8, status: 'critical' },
          { code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', stock: 3, required: 5, status: 'warning' },
          { code: '157322%', name: 'Siemens 8DL5 Sekonder Kablo Seti', stock: 0, required: 2, status: 'critical' },
          { code: '119845%', name: 'LED Lamba Kiti (Kırmızı-Yeşil-Sarı) 24V', stock: 5, required: 10, status: 'warning' },
          { code: '162480%', name: 'Rezistif Gerilim Bölücü 36kV', stock: 1, required: 3, status: 'critical' }
        ],
        alerts: [
          { 
            title: 'Teslim Tarihi Gecikmesi', 
            time: '1 saat önce', 
            message: 'Sipariş No: #0424-1251 - RM 36 CB hücresinin mekanik montajı gecikiyor.',
            source: 'Mekanik Üretim Birimi',
            type: 'danger'
          },
          { 
            title: 'Malzeme Eksikliği', 
            time: '3 saat önce', 
            message: 'Sipariş No: #0424-1245 için gerekli akım trafosu stokta yok.',
            source: 'Satın Alma Birimi',
            type: 'warning'
          },
          { 
            title: 'Yeni Sipariş', 
            time: '5 saat önce', 
            message: 'KEE Enerji için 12 hücrelik yeni bir sipariş oluşturuldu.',
            source: 'Satış Birimi',
            type: 'info'
          },
          {
            title: 'Teknik Değişiklik',
            time: '1 gün önce',
            message: 'RM 36 CB hücre tipleri için şartnameye uygun yeni braket tasarımı onaylandı.',
            source: 'Teknik Ofis',
            type: 'info'
          }
        ]
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      error.value = 'Dashboard verileri yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Sipariş özeti verisi
  const getOrderSummary = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.get('/api/orders/summary')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 800))

      return {
        totalOrders: 42,
        pendingOrders: 12,
        completedOrders: 25,
        delayedOrders: 5,
        stats: {
          thisMonth: 18,
          lastMonth: 15,
          growth: 20 // Yüzde olarak
        },
        recentOrders: [
          { 
            id: '#0424-1251', 
            customer: 'AYEDAŞ', 
            cellType: 'RM 36 CB', 
            status: 'Gecikiyor', 
            progress: 65,
            deliveryDate: '15.05.2025'
          },
          { 
            id: '#0424-1245', 
            customer: 'TEİAŞ', 
            cellType: 'RM 36 CB', 
            status: 'Devam Ediyor', 
            progress: 45,
            deliveryDate: '22.05.2025'
          },
          { 
            id: '#0424-1239', 
            customer: 'BEDAŞ', 
            cellType: 'RM 36 LB', 
            status: 'Devam Ediyor', 
            progress: 30,
            deliveryDate: '01.06.2025'
          }
        ]
      }
    } catch (err) {
      console.error('Error fetching order summary:', err)
      error.value = 'Sipariş özeti yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Envanter özeti verisi - myrule2.mdc'de belirtilen stok kontrolü entegrasyonu için geliştirildi
  const getInventorySummary = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // Canias ERP entegrasyonu
      // const response = await apiService.get('/api/inventory/summary')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 600))

      return {
        totalItems: 156,
        lowStockItems: 14,
        criticalItems: 5,
        onOrderItems: 23,
        stats: {
          usage: 85, // Bu ay kullanım yüzdesi
          turnover: 17 // Stok devir hızı (gün)
        },
        criticalMaterials: [
          { code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', stock: 2, required: 8, status: 'critical', orderStatus: 'Sipariş Edildi', eta: '10.05.2025' },
          { code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', stock: 3, required: 5, status: 'warning', orderStatus: 'Sipariş Edilecek', eta: '-' },
          { code: '157322%', name: 'Siemens 8DL5 Sekonder Kablo Seti', stock: 0, required: 2, status: 'critical', orderStatus: 'Sipariş Edildi', eta: '08.05.2025' },
          { code: '162480%', name: 'Rezistif Gerilim Bölücü 36kV', stock: 1, required: 3, status: 'critical', orderStatus: 'Sipariş Onayda', eta: '-' },
          { code: '119845%', name: 'LED Lamba Kiti (Kırmızı-Yeşil-Sarı) 24V', stock: 5, required: 10, status: 'warning', orderStatus: 'Stok Kontrolü', eta: '-' }
        ],
        materialCategories: {
          labels: ['Elektronik', 'Mekanik', 'Kablolar', 'Bağlantı Elemanları', 'Diğer'],
          datasets: [
            {
              data: [30, 25, 15, 20, 10],
              backgroundColor: [
                'rgba(58, 117, 196, 0.8)',
                'rgba(40, 167, 69, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(220, 53, 69, 0.8)',
                'rgba(108, 117, 125, 0.8)'
              ]
            }
          ]
        }
      }
    } catch (err) {
      console.error('Error fetching inventory summary:', err)
      error.value = 'Envanter özeti yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Üretim özeti verisi - myrule2.mdc'de belirtilen üretim takibi için geliştirildi
  const getProductionSummary = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.get('/api/production/summary')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 700))

      return {
        activeTasks: 18,
        completedTasks: 34,
        efficiency: 92, // Yüzde olarak
        utilization: 78, // Yüzde olarak
        stats: {
          thisMonth: 42,
          lastMonth: 38,
          growth: 10.5 // Yüzde olarak
        },
        delays: {
          mechanical: 2,
          electrical: 1, 
          testing: 0,
          total: 3
        },
        // Üretim durumları için grafik verisi - myrule2.mdc'de belirtilen üretim süreçlerini otomatikleştirmek için
        productionStatus: {
          labels: ['Mekanik Montaj', 'Elektrik Montaj', 'Test', 'Son Kontrol', 'Sevkiyat'],
          completed: [8, 6, 5, 4, 3],
          inProgress: [4, 5, 3, 2, 1],
          notStarted: [6, 7, 10, 12, 14]
        }
      }
    } catch (err) {
      console.error('Error fetching production summary:', err)
      error.value = 'Üretim özeti yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Son aktiviteler - myrule2.mdc'de belirtilen not ve uyarı sistemi
  const getRecentActivities = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.get('/api/activities/recent')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 500))

      return [
        {
          id: 1,
          type: 'order',
          title: 'Yeni sipariş eklendi',
          description: 'AYEDAŞ için 8 adet RM 36 CB hücre siparişi',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 dakika önce
          user: 'Ahmet Yılmaz',
          priority: 'medium'
        },
        {
          id: 2,
          type: 'production',
          title: 'Üretim tamamlandı',
          description: 'Sipariş #0424-1239 için RM 36 LB hücreleri test aşamasında',
          timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 saat önce
          user: 'Mehmet Demir',
          priority: 'medium'
        },
        {
          id: 3,
          type: 'inventory',
          title: 'Stok uyarısı',
          description: 'Siemens 7SR1003 röle kritik seviyenin altında',
          timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 saat önce
          user: 'Sistem',
          priority: 'high'
        },
        {
          id: 4,
          type: 'purchase',
          title: 'Satın alma talebi onaylandı',
          description: 'Siemens tedarikçisinden 10 adet röle siparişi',
          timestamp: new Date(Date.now() - 1000 * 60 * 250), // 4+ saat önce
          user: 'Ayşe Kara',
          priority: 'medium'
        },
        {
          id: 5,
          type: 'technical',
          title: 'Teknik değişiklik',
          description: 'RM 36 CB hücre tipi için yeni braket tasarımı onaylandı',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 gün önce
          user: 'Teknik Ofis',
          priority: 'low'
        }
      ]
    } catch (err) {
      console.error('Error fetching recent activities:', err)
      error.value = 'Son aktiviteler yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Bildirimler
  const getNotifications = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.get('/api/notifications')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 400))

      return [
        {
          id: 1,
          title: 'Sipariş #0424-1251 gecikmesi',
          message: 'RM 36 CB hücresinin mekanik montajı gecikiyor.',
          type: 'danger',
          source: 'Mekanik Üretim Birimi',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 saat önce
          read: false
        },
        {
          id: 2,
          title: 'Kritik stok seviyesi',
          message: 'Siemens 7SR1003 röle kritik stok seviyesinin altında.',
          type: 'warning',
          source: 'Sistem',
          timestamp: new Date(Date.now() - 1000 * 60 * 65), // 65 dakika önce
          read: false
        },
        {
          id: 3,
          title: 'Yeni sipariş',
          message: 'KEE Enerji için 12 hücrelik yeni bir sipariş oluşturuldu.',
          type: 'info',
          source: 'Satış Birimi',
          timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 saat önce
          read: false
        },
        {
          id: 4,
          title: 'Teknik değişiklik',
          message: 'RM 36 CB hücre tipleri için yeni braket tasarımı onaylandı.',
          type: 'info',
          source: 'Teknik Ofis',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 gün önce
          read: true
        }
      ]
    } catch (err) {
      console.error('Error fetching notifications:', err)
      error.value = 'Bildirimler yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Haftalık sipariş verileri (grafik için)
  const getWeeklyOrdersData = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.get('/api/orders/weekly')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 600))

      const labels = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
      
      return {
        labels,
        datasets: [
          {
            label: 'Bu Hafta',
            data: [5, 8, 10, 7, 12, 4, 3],
            borderColor: '#3a75c4',
            backgroundColor: 'rgba(58, 117, 196, 0.2)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Geçen Hafta',
            data: [4, 6, 8, 9, 6, 5, 3],
            borderColor: '#6c757d',
            backgroundColor: 'rgba(108, 117, 125, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.3,
            fill: true
          }
        ]
      }
    } catch (err) {
      console.error('Error fetching weekly orders data:', err)
      error.value = 'Haftalık sipariş verileri yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Aylık üretim verileri (grafik için)
  const getMonthlyProductionData = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.get('/api/production/monthly')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 700))

      // Son 6 ay etiketlerini oluştur
      const currentDate = new Date()
      const labels = []
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate)
        date.setMonth(date.getMonth() - i)
        const monthName = date.toLocaleString('tr-TR', { month: 'short' })
        labels.push(monthName)
      }
      
      return {
        labels,
        datasets: [
          {
            label: 'Planlanan Üretim',
            data: [65, 70, 80, 85, 90, 95],
            backgroundColor: 'rgba(58, 117, 196, 0.7)',
            categoryPercentage: 0.6,
            barPercentage: 0.8
          },
          {
            label: 'Gerçekleşen Üretim',
            data: [60, 65, 75, 80, 85, 92],
            backgroundColor: 'rgba(40, 167, 69, 0.7)',
            categoryPercentage: 0.6,
            barPercentage: 0.8
          }
        ]
      }
    } catch (err) {
      console.error('Error fetching monthly production data:', err)
      error.value = 'Aylık üretim verileri yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Malzeme kategorileri dağılımı (pasta grafik için)
  const getMaterialCategoriesData = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.get('/api/materials/categories')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return {
        labels: ['Elektronik', 'Mekanik', 'Kablolar', 'Bağlantı Elemanları', 'Diğer'],
        datasets: [
          {
            data: [30, 25, 15, 20, 10],
            backgroundColor: [
              'rgba(58, 117, 196, 0.8)',
              'rgba(40, 167, 69, 0.8)',
              'rgba(255, 193, 7, 0.8)',
              'rgba(220, 53, 69, 0.8)',
              'rgba(108, 117, 125, 0.8)'
            ],
            hoverOffset: 4
          }
        ]
      }
    } catch (err) {
      console.error('Error fetching material categories data:', err)
      error.value = 'Malzeme kategori verileri yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Hücre tipi dağılımı verisi (dashboard için)
  const getCellTypeDistributionData = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.get('/api/analytics/cell-types')
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 450))

      return {
        labels: ['RM 36 CB', 'RM 36 Switch', 'RM 36 VT', 'RM 36 Cable', 'RM 36 M+F', 'RM 36 Others'],
        data: [35, 25, 15, 10, 8, 7],
        backgroundColor: [
          '#0d6efd',
          '#20c997',
          '#ffc107',
          '#fd7e14',
          '#6f42c1',
          '#adb5bd'
        ]
      }
    } catch (err) {
      console.error('Error fetching cell type distribution data:', err)
      error.value = 'Hücre tipi dağılımı verileri yüklenirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Üretim verileri (haftalık/aylık dashboard için)
  const getProductionData = async (period = 'monthly') => {
    isLoading.value = true
    error.value = null

    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.get(`/api/production/data?period=${period}`)
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 550))

      // Etiketleri oluştur
      let labels = [];
      
      if (period === 'weekly') {
        labels = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
      } else {
        // Son 6 ay etiketlerini oluştur
        const currentDate = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(currentDate.getMonth() - i);
          labels.push(date.toLocaleString('tr-TR', { month: 'short' }));
        }
      }
      
      return {
        labels,
        datasets: [
          {
            label: 'Planlanan Üretim',
            data: period === 'weekly' 
              ? [12, 15, 18, 14, 16, 10, 8]
              : [35, 42, 45, 50, 48, 55, 60],
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Gerçekleşen Üretim',
            data: period === 'weekly' 
              ? [10, 13, 16, 14, 15, 9, 7]
              : [32, 38, 43, 45, 42, 50, 55],
            borderColor: '#20c997',
            backgroundColor: 'rgba(32, 201, 151, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Hedef Üretim',
            data: period === 'weekly' 
              ? [14, 14, 14, 14, 14, 8, 8]
              : [40, 40, 40, 45, 45, 50, 50],
            borderColor: '#ffc107',
            borderDash: [5, 5],
            backgroundColor: 'rgba(0, 0, 0, 0)',
            tension: 0,
            fill: false
          }
        ]
      }
    } catch (err) {
      console.error('Error fetching production data:', err)
      error.value = `${period === 'weekly' ? 'Haftalık' : 'Aylık'} üretim verileri yüklenirken bir hata oluştu`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Notları kaydet (myrule2.mdc'de belirtilen not ve uyarı sistemi için)
  const saveNote = async (note) => {
    isLoading.value = true
    error.value = null
    
    try {
      // Gerçek bir API çağrısı burada yapılabilir
      // const response = await apiService.post('/api/notes/save', note)
      
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 400))
      
      console.log('Not kaydedildi:', note)
      return { 
        success: true, 
        noteId: Math.floor(Math.random() * 1000) + 1,
        message: 'Not başarıyla kaydedildi'
      }
    } catch (err) {
      console.error('Error saving note:', err)
      error.value = 'Not kaydedilirken bir hata oluştu'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    getDashboardData,
    getOrderSummary,
    getInventorySummary,
    getProductionSummary,
    getRecentActivities,
    getNotifications,
    getWeeklyOrdersData,
    getMonthlyProductionData,
    getMaterialCategoriesData,
    getCellTypeDistributionData,
    getProductionData,
    saveNote
  }
}