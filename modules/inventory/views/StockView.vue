<template>
  <div class="stock-container">
    <h1 class="page-title">Stok Yönetimi</h1>
    
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="search-filters d-flex gap-3">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Malzeme adı, kodu veya açıklaması ile ara..." 
              v-model="searchQuery"
              @input="onSearch"
            />
            <button class="btn btn-outline-secondary" type="button">
              <i class="bi bi-search"></i>
            </button>
          </div>
          
          <div class="input-group" style="max-width: 200px;">
            <select class="form-select" v-model="categoryFilter">
              <option value="all">Tüm Kategoriler</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
      <div class="col-md-4 text-end">
        <button class="btn btn-primary me-2" @click="openNewStockItemModal">
          <i class="bi bi-plus-circle me-1"></i> Stok Ekle
        </button>
        <button class="btn btn-outline-secondary me-2" @click="importStock">
          <i class="bi bi-upload me-1"></i> İçe Aktar
        </button>
        <button class="btn btn-outline-secondary" @click="exportStock">
          <i class="bi bi-download me-1"></i> Dışa Aktar
        </button>
      </div>
    </div>

    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card summary-card">
          <div class="card-body">
            <h5 class="card-title">Toplam Stok Kalem Sayısı</h5>
            <h2 class="card-value">{{ stockStats.totalItems }}</h2>
            <p class="card-trend up">
              <i class="bi bi-arrow-up-right"></i> %5 artış
            </p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card summary-card">
          <div class="card-body">
            <h5 class="card-title">Düşük Stoklu Kalem</h5>
            <h2 class="card-value">{{ stockStats.lowStockItems }}</h2>
            <p class="card-trend warning">
              <i class="bi bi-exclamation-triangle"></i> Dikkat
            </p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card summary-card">
          <div class="card-body">
            <h5 class="card-title">Toplam Stok Değeri</h5>
            <h2 class="card-value">₺{{ formatPrice(stockStats.totalValue) }}</h2>
            <p class="card-trend up">
              <i class="bi bi-arrow-up-right"></i> %12 artış
            </p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card summary-card">
          <div class="card-body">
            <h5 class="card-title">Stok Devir Hızı</h5>
            <h2 class="card-value">{{ stockStats.turnoverRate }}</h2>
            <p class="card-trend down">
              <i class="bi bi-arrow-down-right"></i> %2 düşüş
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Stok Listesi</h5>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
            <i class="bi bi-list"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">
            <i class="bi bi-grid"></i>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Yükleniyor...</span>
          </div>
          <p class="mt-2">Stok verileri yükleniyor...</p>
        </div>
        
        <div v-else-if="filteredStockItems.length === 0" class="text-center py-5">
          <p class="text-muted mb-3">Görüntülenecek stok verisi bulunamadı.</p>
          <button class="btn btn-primary" @click="openNewStockItemModal">
            <i class="bi bi-plus-circle me-1"></i> Stok Ekle
          </button>
        </div>
        
        <div v-else>
          <!-- Table view mode -->
          <div v-if="viewMode === 'table'">
            <table class="table table-hover table-bordered">
              <thead>
                <tr>
                  <th @click="sortBy('code')" class="sortable">
                    Kod <i :class="getSortIcon('code')"></i>
                  </th>
                  <th @click="sortBy('name')" class="sortable">
                    Ad <i :class="getSortIcon('name')"></i>
                  </th>
                  <th @click="sortBy('category')" class="sortable">
                    Kategori <i :class="getSortIcon('category')"></i>
                  </th>
                  <th @click="sortBy('currentQuantity')" class="sortable">
                    Miktar <i :class="getSortIcon('currentQuantity')"></i>
                  </th>
                  <th @click="sortBy('unit')" class="sortable">
                    Birim <i :class="getSortIcon('unit')"></i>
                  </th>
                  <th @click="sortBy('unitPrice')" class="sortable">
                    Birim Fiyat <i :class="getSortIcon('unitPrice')"></i>
                  </th>
                  <th @click="sortBy('status')" class="sortable">
                    Durum <i :class="getSortIcon('status')"></i>
                  </th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredStockItems" :key="item.id" :class="getRowClass(item)">
                  <td>{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ getCategoryName(item.categoryId) }}</td>
                  <td>{{ item.currentQuantity }}</td>
                  <td>{{ item.unit }}</td>
                  <td>₺{{ formatPrice(item.unitPrice) }}</td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(item)">
                      {{ getStockStatus(item) }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-sm btn-outline-primary" @click="viewStockItem(item)">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" @click="editStockItem(item)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteStockItem(item)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div class="d-flex justify-content-between align-items-center mt-3">
              <div>
                <span class="text-muted">{{ filteredStockItems.length }} kalem gösteriliyor</span>
              </div>
              <nav aria-label="Page navigation">
                <ul class="pagination">
                  <li class="page-item disabled">
                    <a class="page-link" href="#" tabindex="-1">Önceki</a>
                  </li>
                  <li class="page-item active"><a class="page-link" href="#">1</a></li>
                  <li class="page-item"><a class="page-link" href="#">2</a></li>
                  <li class="page-item"><a class="page-link" href="#">3</a></li>
                  <li class="page-item">
                    <a class="page-link" href="#">Sonraki</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
          
          <!-- Grid view mode -->
          <div v-else-if="viewMode === 'grid'" class="row">
            <div v-for="item in filteredStockItems" :key="item.id" class="col-md-3 mb-4">
              <div class="card h-100" :class="{'border-warning': isLowStock(item)}">
                <div class="card-body">
                  <h5 class="card-title">{{ item.name }}</h5>
                  <h6 class="card-subtitle mb-2 text-muted">{{ item.code }}</h6>
                  <p class="card-text mb-1">
                    <strong>Kategori:</strong> {{ getCategoryName(item.categoryId) }}
                  </p>
                  <p class="card-text mb-1">
                    <strong>Miktar:</strong> {{ item.currentQuantity }} {{ item.unit }}
                  </p>
                  <p class="card-text mb-1">
                    <strong>Birim Fiyat:</strong> ₺{{ formatPrice(item.unitPrice) }}
                  </p>
                  <p class="card-text mb-1">
                    <strong>Durum:</strong> 
                    <span class="badge" :class="getStatusBadgeClass(item)">
                      {{ getStockStatus(item) }}
                    </span>
                  </p>
                </div>
                <div class="card-footer bg-transparent border-top">
                  <div class="btn-group w-100">
                    <button class="btn btn-sm btn-outline-primary" @click="viewStockItem(item)">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" @click="editStockItem(item)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteStockItem(item)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StockView',
  data() {
    return {
      isLoading: true,
      searchQuery: '',
      categoryFilter: 'all',
      viewMode: 'table',
      sortKey: 'name',
      sortOrder: 'asc',
      stockItems: [],
      categories: [],
      stockStats: {
        totalItems: 0,
        lowStockItems: 0,
        totalValue: 0,
        turnoverRate: 0
      }
    }
  },
  computed: {
    filteredStockItems() {
      let filtered = [...this.stockItems];
      
      // Apply search filter
      if (this.searchQuery.trim() !== '') {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
        );
      }
      
      // Apply category filter
      if (this.categoryFilter !== 'all') {
        filtered = filtered.filter(item => item.categoryId === this.categoryFilter);
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;
        const aValue = a[this.sortKey];
        const bValue = b[this.sortKey];
        
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }
        
        return this.sortOrder === 'asc' ? comparison : -comparison;
      });
      
      return filtered;
    }
  },
  methods: {
    async fetchStockData() {
      this.isLoading = true;
      try {
        // API çağrısı simülasyonu
        setTimeout(() => {
          this.stockItems = [
            {
              id: 1,
              code: 'MLZ-001',
              name: 'Kontaktör 220V',
              categoryId: 'cat1',
              currentQuantity: 25,
              minimumQuantity: 10,
              unit: 'adet',
              unitPrice: 145.50,
              description: '3 kutuplu 220V kontaktör'
            },
            {
              id: 2,
              code: 'MLZ-002',
              name: 'PLC CPU Modülü',
              categoryId: 'cat2',
              currentQuantity: 5,
              minimumQuantity: 8,
              unit: 'adet',
              unitPrice: 3750.00,
              description: 'Siemens S7-1200 CPU 1214C'
            },
            {
              id: 3,
              code: 'MLZ-003',
              name: 'Güç Kaynağı 24V',
              categoryId: 'cat3',
              currentQuantity: 12,
              minimumQuantity: 5,
              unit: 'adet',
              unitPrice: 850.75,
              description: '24V 5A DC güç kaynağı'
            },
            {
              id: 4,
              code: 'MLZ-004',
              name: 'Motor Sürücü 7.5kW',
              categoryId: 'cat4',
              currentQuantity: 8,
              minimumQuantity: 3,
              unit: 'adet',
              unitPrice: 4200.00,
              description: 'ABB ACS880 7.5kW frekans inverteri'
            },
            {
              id: 5,
              code: 'MLZ-005',
              name: 'Bakır Kablo 1.5mm²',
              categoryId: 'cat5',
              currentQuantity: 750,
              minimumQuantity: 100,
              unit: 'metre',
              unitPrice: 12.50,
              description: 'H07V-U 1.5mm² tek damarlı bakır kablo'
            },
            {
              id: 6,
              code: 'MLZ-006',
              name: 'HMI Panel 7"',
              categoryId: 'cat2',
              currentQuantity: 2,
              minimumQuantity: 4,
              unit: 'adet',
              unitPrice: 6800.00,
              description: 'Siemens KTP700 Basic Panel'
            }
          ];
          
          this.categories = [
            { id: 'cat1', name: 'Elektrik Komponentleri' },
            { id: 'cat2', name: 'Otomasyon Ürünleri' },
            { id: 'cat3', name: 'Güç Kaynakları' },
            { id: 'cat4', name: 'Motor Sürücüler' },
            { id: 'cat5', name: 'Kablolar' }
          ];
          
          // Hesaplanan istatistikler
          this.stockStats = {
            totalItems: this.stockItems.length,
            lowStockItems: this.stockItems.filter(item => 
              item.currentQuantity < item.minimumQuantity
            ).length,
            totalValue: this.stockItems.reduce(
              (total, item) => total + (item.currentQuantity * item.unitPrice), 
              0
            ),
            turnoverRate: 4.2 // Örnek değer
          };
          
          this.isLoading = false;
        }, 1000);
      } catch (error) {
        console.error('Stok verisi alınamadı:', error);
        this.isLoading = false;
      }
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    getSortIcon(key) {
      if (this.sortKey !== key) return 'bi bi-arrow-down-up text-muted';
      return this.sortOrder === 'asc' ? 'bi bi-arrow-down' : 'bi bi-arrow-up';
    },
    onSearch() {
      // Arama işlemi burada gerçekleştirilecek
      console.log('Searching for:', this.searchQuery);
    },
    openNewStockItemModal() {
      // Yeni stok kalemi ekleme modalını aç
      alert('Yeni stok kalemi ekle modalı - implementasyon bekleniyor');
    },
    editStockItem(item) {
      // Stok kalemi düzenleme modalını aç
      alert(`"${item.name}" düzenleme modalı - implementasyon bekleniyor`);
    },
    deleteStockItem(item) {
      // Stok kalemi silme onayını göster
      if (confirm(`"${item.name}" stok kalemini silmek istediğinize emin misiniz?`)) {
        // Silme işlemi burada gerçekleştirilecek
        this.stockItems = this.stockItems.filter(i => i.id !== item.id);
        this.updateStockStats();
      }
    },
    viewStockItem(item) {
      // Stok kalemi detaylarını görüntüle
      alert(`"${item.name}" detayları - implementasyon bekleniyor`);
    },
    importStock() {
      // Stok verisi içe aktarma işlemi
      alert('Stok verisi içe aktarılıyor - implementasyon bekleniyor');
    },
    exportStock() {
      // Stok verisi dışa aktarma işlemi
      alert('Stok verisi dışa aktarılıyor - implementasyon bekleniyor');
    },
    updateStockStats() {
      // İstatistikleri güncelle
      this.stockStats = {
        totalItems: this.stockItems.length,
        lowStockItems: this.stockItems.filter(item => 
          item.currentQuantity < item.minimumQuantity
        ).length,
        totalValue: this.stockItems.reduce(
          (total, item) => total + (item.currentQuantity * item.unitPrice), 
          0
        ),
        turnoverRate: this.stockStats.turnoverRate // Mevcut değeri koru
      };
    },
    formatPrice(price) {
      return price.toFixed(2).replace('.', ',');
    },
    isLowStock(item) {
      return item.currentQuantity < item.minimumQuantity;
    },
    getStockStatus(item) {
      if (item.currentQuantity <= 0) {
        return 'Stokta Yok';
      } else if (item.currentQuantity < item.minimumQuantity) {
        return 'Düşük Stok';
      } else {
        return 'Stokta Var';
      }
    },
    getStatusBadgeClass(item) {
      if (item.currentQuantity <= 0) {
        return 'bg-danger';
      } else if (item.currentQuantity < item.minimumQuantity) {
        return 'bg-warning';
      } else {
        return 'bg-success';
      }
    },
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : '';
    },
    getRowClass(item) {
      if (item.currentQuantity <= 0) {
        return 'table-danger';
      } else if (item.currentQuantity < item.minimumQuantity) {
        return 'table-warning';
      }
      return '';
    }
  },
  created() {
    this.fetchStockData();
  }
}
</script>

<style scoped>
.stock-container {
  padding: 1rem;
}

.summary-card {
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  height: 100%;
}

.card-value {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.card-trend {
  font-size: 0.875rem;
  margin-bottom: 0;
}

.card-trend.up {
  color: #28a745;
}

.card-trend.down {
  color: #dc3545;
}

.card-trend.warning {
  color: #ffc107;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>