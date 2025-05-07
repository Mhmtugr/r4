/**
 * API Servisi
 * Modern REST API entegrasyonu ve mock verileri yönetir
 */

import { useAuthStore } from '@/store/auth';
import appConfig from '@/config'; // Import config instead of using window

class ApiService {
  constructor() {
    // Config dosyasından veya ortam değişkenlerinden al
    this.baseUrl = appConfig.apiUrl || import.meta.env.VITE_API_URL || '/api'; // Use import.meta.env for Vite
    this.mockMode = appConfig.useDemoMode ?? (import.meta.env.MODE === 'development'); // Default to true in dev if not specified
    
    console.log('API Servisi başlatılıyor', { baseUrl: this.baseUrl, mockMode: this.mockMode });
  }
  
  async get(endpoint, params = {}) {
    if (this.mockMode) {
      return this.getMockData(endpoint, params);
    }
    
    try {
      const url = new URL(endpoint, this.baseUrl); // Use URL constructor correctly
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this._getHeaders()
      });
      
      return this._handleResponse(response);
    } catch (error) {
      console.error(`GET ${endpoint} başarısız:`, error);
      throw this._handleError(error);
    }
  }
  
  async post(endpoint, data = {}) {
    if (this.mockMode) {
      return this.postMockData(endpoint, data);
    }
    
    try {
      const url = new URL(endpoint, this.baseUrl);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(data)
      });
      
      return this._handleResponse(response);
    } catch (error) {
      console.error(`POST ${endpoint} başarısız:`, error);
      throw this._handleError(error);
    }
  }

  async put(endpoint, data = {}) {
    if (this.mockMode) {
       // PUT için mock veriyi POST gibi ele alabiliriz veya özelleştirebiliriz
      return this.postMockData(endpoint, data, 'PUT'); 
    }
    
    try {
      const url = new URL(endpoint, this.baseUrl);
      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: this._getHeaders(),
        body: JSON.stringify(data)
      });
      
      return this._handleResponse(response);
    } catch (error) {
      console.error(`PUT ${endpoint} başarısız:`, error);
       throw this._handleError(error);
    }
  }

  async delete(endpoint) {
    if (this.mockMode) {
      return this.deleteMockData(endpoint);
    }
    
    try {
      const url = new URL(endpoint, this.baseUrl);
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: this._getHeaders()
      });
      
      // DELETE genellikle içerik döndürmez, başarı durumunu kontrol et
      return this._handleResponse(response, true); // Expect no content
    } catch (error) {
      console.error(`DELETE ${endpoint} başarısız:`, error);
       throw this._handleError(error);
    }
  }
  
  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json' // Added Accept header
    };

    // Pinia store'u doğrudan burada kullanmak yerine, 
    // dışarıdan inject etmek veya interceptor kullanmak daha iyi olabilir.
    // Şimdilik mevcut yapıyı koruyalım.
    try {
       const authStore = useAuthStore();
       const token = authStore.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
       }
    } catch (e) {
        console.warn('Auth store could not be accessed outside setup. Ensure Pinia is initialized.');
    }
    
    return headers;
  }
  
  async _handleResponse(response, expectNoContent = false) {
    if (!response.ok) {
       const error = new Error(`HTTP error! Status: ${response.status}`);
       try {
           const errorData = await response.json();
           error.data = errorData;
           error.message = errorData.message || error.message; 
       } catch (e) {
            // JSON parse edilemezse status text'i kullan
           error.message = `${error.message} - ${response.statusText}`;
       }
       
      if (response.status === 401) {
         // Yetkilendirme hatasında logout yap
         try {
        const authStore = useAuthStore();
        authStore.logout();
         } catch (e) { 
            console.warn('Auth store could not be accessed outside setup for logout.');
         }
       }
       throw error; // Hata nesnesini fırlat
    }
    
    if (expectNoContent || response.status === 204) { 
      return; // No content expected or received
    }

    // Başarılı yanıtı JSON olarak parse et
    try {
        return await response.json();
    } catch(e) {
        // JSON parse hatası durumunda boş yanıt veya hata fırlatılabilir
        console.error('API response JSON parse error:', e);
        throw new Error('Invalid JSON response from server');
    }
  }
  
   _handleError(error) {
        // Ağ hatası veya diğer fetch hatalarını işle
        if (!error.response) { // Eğer `_handleResponse` içinden gelmiyorsa (örn: ağ hatası)
             error.message = `Network Error: ${error.message}`;
        }
        // Hata loglanabilir veya global bir hata state'ine gönderilebilir
        // Şimdilik sadece hatayı tekrar fırlatıyoruz
        return error;
   }

  //-----------------------------------------------------
  // Spesifik Endpoint Metodları (R3/apiService.js'den)
  //-----------------------------------------------------

  async getOrders(params = {}) {
    return this.get('/orders', params);
  }

  async getOrderDetails(orderId) {
    return this.get(`/orders/${orderId}`);
  }

  async createOrder(orderData) {
    return this.post('/orders', orderData);
  }

  async updateOrder(orderId, orderData) {
    return this.put(`/orders/${orderId}`, orderData);
  }

  async deleteOrder(orderId) {
    return this.delete(`/orders/${orderId}`);
  }

  async getProductionData() {
    // Bu endpoint daha spesifik olabilir, örn: /production/summary
    return this.get('/production'); 
  }

  async updateProductionStatus(statusData) {
    // Endpoint /production/:id/status veya /production/status olabilir
    return this.put('/production/status', statusData); 
  }

  async getInventory(params = {}) {
     // R3'teki endpoint /stock idi, /inventory daha mantıklı olabilir
    return this.get('/inventory', params); 
  }

  async updateInventoryItem(itemId, itemData) {
    return this.put(`/inventory/${itemId}`, itemData);
  }
  
   // Diğer spesifik metodlar eklenebilir (kullanıcılar, malzemeler vb.)

  //-----------------------------------------------------
  // Mock Veri Yönetimi (Geliştirilmiş)
  //-----------------------------------------------------

  getMockData(endpoint, params) {
    console.log(`%cMock GET: ${endpoint}`, 'color: blue; font-weight: bold;', params);
    const url = new URL(endpoint, 'http://mock.url'); // Parametreleri parse etmek için
    const path = url.pathname;

    // Siparişler
    if (path === '/orders') {
        // TODO: Parametrelere göre filtreleme/sayfalama eklenebilir
        return Promise.resolve(this._mockData.orders); 
    }
    if (path.startsWith('/orders/')) {
        const orderId = path.split('/')[2];
        const order = this._mockData.orders.find(o => o.id === orderId);
        return order ? Promise.resolve(order) : Promise.reject(new Error('Mock Order Not Found'));
    }

    // Üretim
    if (path === '/production') {
        return Promise.resolve(this._mockData.production); 
    }
    if (path === '/production/status') { 
         return Promise.resolve({ success: true }); // PUT için mock yanıt
    }

    // Envanter
    if (path === '/inventory') {
        return Promise.resolve(this._mockData.inventory);
    }
     if (path.startsWith('/inventory/')) {
         return Promise.resolve({ success: true }); // PUT için mock yanıt
     }

    // Dashboard (Örnekler src/api-service.js'den alınabilir)
     if (path === '/dashboard/stats') { 
         return Promise.resolve(this._mockData.dashboardStats); 
     }
     if (path === '/dashboard/order-trend') {
         return Promise.resolve(this._mockData.dashboardOrderTrend);
     }
     // ... diğer dashboard endpointleri

    console.warn(`Mock GET için endpoint bulunamadı: ${endpoint}`);
    return Promise.reject(new Error(`Mock data not found for GET ${endpoint}`));
  }

  postMockData(endpoint, data, method = 'POST') {
    console.log(`%cMock ${method}: ${endpoint}`, 'color: green; font-weight: bold;', data);
    const url = new URL(endpoint, 'http://mock.url');
    const path = url.pathname;

    if (path === '/orders') {
      const newOrder = { ...data, id: `ord-${Date.now()}`, status: 'Planlandı' };
      this._mockData.orders.push(newOrder);
      return Promise.resolve(newOrder);
    }
    if (path === '/production/status' && method === 'PUT') {
        // Update mock production status if needed
        console.log('Mock production status updated:', data);
        return Promise.resolve({ success: true });
    }
     if (path.startsWith('/inventory/') && method === 'PUT') {
         // Update mock inventory item if needed
         const itemId = path.split('/')[2];
         console.log(`Mock inventory item ${itemId} updated:`, data);
         return Promise.resolve({ success: true });
     }

    console.warn(`Mock ${method} için endpoint bulunamadı: ${endpoint}`);
    return Promise.resolve({ success: true, message: `Mock ${method} successful`, data });
  }

  deleteMockData(endpoint) {
    console.log(`%cMock DELETE: ${endpoint}`, 'color: red; font-weight: bold;');
     const url = new URL(endpoint, 'http://mock.url');
     const path = url.pathname;

     if (path.startsWith('/orders/')) {
         const orderId = path.split('/')[2];
         const index = this._mockData.orders.findIndex(o => o.id === orderId);
         if (index > -1) {
             this._mockData.orders.splice(index, 1);
             return Promise.resolve(); // No content
         } else {
             return Promise.reject(new Error('Mock Order Not Found for DELETE'));
         }
     }
     
     console.warn(`Mock DELETE için endpoint bulunamadı: ${endpoint}`);
     return Promise.resolve(); // Başarılı varsayalım
  }

  // Merkezi Mock Veri Deposu
  _mockData = {
      orders: [
          { id: 'ord-001', orderNumber: 'SIP-2024001', customer: 'AYEDAŞ', cellType: 'RM 36 CB', quantity: 1, deliveryDate: '2024-11-15', status: 'Gecikiyor', progress: 65, priority: 'high' },
          { id: 'ord-002', orderNumber: 'SIP-2024002', customer: 'TEİAŞ', cellType: 'RM 36 CB', quantity: 1, deliveryDate: '2024-11-20', status: 'Devam Ediyor', progress: 80, priority: 'medium' },
           { id: 'ord-003', orderNumber: 'SIP-2024003', customer: 'BEDAŞ', cellType: 'RM 36 LB', quantity: 2, deliveryDate: '2024-10-30', status: 'Planlandı', progress: 10, priority: 'low' }
      ],
      production: {
          progress: 75,
          activeOrders: 12,
          completedOrders: 45,
          delayedOrders: 3,
          // ... R3 mock verisinden plan ve raporlar eklenebilir
      },
      inventory: [
          { id: 'mat-001', code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', quantity: 2, minStock: 5, status: 'Kritik' },
          { id: 'mat-002', code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', quantity: 3, minStock: 5, status: 'Düşük' },
           { id: 'mat-003', code: '120170%', name: 'M480TB/G-027-95.300UN5 Kablo Başlığı', quantity: 12, minStock: 10, status: 'Yeterli' }
      ],
       dashboardStats: { /* ... */ },
       dashboardOrderTrend: { /* ... */ }
      // ... diğer mock veriler
  };
}

// Singleton instance oluştur ve export et
export const apiService = new ApiService();