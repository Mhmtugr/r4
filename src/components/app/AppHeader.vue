<template>
  <header class="app-header">
    <div class="header-left">
      <button class="btn btn-icon toggle-sidebar-btn" @click="toggleSidebar">
        <i class="bi" :class="isSidebarCollapsed ? 'bi-list' : 'bi-x'"></i>
      </button>
      
      <div class="page-title">
        <h1>{{ currentPageTitle }}</h1>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li v-for="(item, index) in breadcrumbs" :key="index" class="breadcrumb-item" :class="{ 'active': index === breadcrumbs.length - 1 }">
              <router-link v-if="index !== breadcrumbs.length - 1" :to="item.path">{{ item.title }}</router-link>
              <span v-else>{{ item.title }}</span>
            </li>
          </ol>
        </nav>
      </div>
    </div>
    
    <div class="header-right">
      <!-- Arama -->
      <div class="header-search">
        <div class="search-wrapper">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="Ara..." @focus="searchFocused = true" @blur="onSearchBlur" v-model="searchQuery" />
          <i v-if="searchQuery" class="bi bi-x-circle" @click="clearSearch"></i>
        </div>
        <div class="search-results" v-if="searchFocused && searchQuery">
          <div class="search-results-content">
            <div v-if="isSearching" class="search-loading">
              <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Aranıyor...</span>
              </div>
              <span>Aranıyor...</span>
            </div>
            <template v-else>
              <div v-if="searchResults.length === 0" class="search-no-results">
                <i class="bi bi-file-earmark-x"></i>
                <span>Sonuç bulunamadı</span>
              </div>
              <div v-else class="search-results-list">
                <div v-for="(result, index) in searchResults" :key="index" class="search-result-item" @click="navigateToSearchResult(result)">
                  <i :class="`bi ${getSearchResultIcon(result.type)}`"></i>
                  <div class="search-result-info">
                    <div class="search-result-title">{{ result.title }}</div>
                    <div class="search-result-subtitle">{{ result.subtitle }}</div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      
      <!-- Bildirimler -->
      <div class="header-notifications dropdown">
        <button class="btn btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-bell"></i>
          <span v-if="unreadNotifications > 0" class="notification-badge">{{ unreadNotifications }}</span>
        </button>
        <ul class="dropdown-menu notifications-dropdown">
          <div class="notifications-header">
            <h6 class="dropdown-header">Bildirimler</h6>
            <button v-if="notifications.length > 0" class="btn btn-link btn-sm" @click="markAllAsRead">Tümünü Okundu İşaretle</button>
          </div>
          <div class="notifications-body">
            <div v-if="notifications.length === 0" class="notifications-empty">
              <i class="bi bi-bell-slash"></i>
              <span>Bildiriminiz bulunmuyor</span>
            </div>
            <template v-else>
              <li v-for="(notification, index) in notifications" :key="index">
                <a class="dropdown-item notification-item" :class="{ 'unread': !notification.read }" @click="readNotification(notification)">
                  <div class="notification-icon" :class="`bg-${notification.type}`">
                    <i :class="`bi ${getNotificationIcon(notification.type)}`"></i>
                  </div>
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-text">{{ notification.message }}</div>
                    <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
                  </div>
                </a>
              </li>
              <li v-if="notifications.length >= 5">
                <div class="dropdown-item text-center">
                  <router-link to="/notifications" class="btn btn-link btn-sm">Tüm Bildirimleri Gör</router-link>
                </div>
              </li>
            </template>
          </div>
        </ul>
      </div>
      
      <!-- Temayı Değiştir -->
      <button class="btn btn-icon" @click="toggleDarkMode" :title="isDarkMode ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'">
        <i class="bi" :class="isDarkMode ? 'bi-sun' : 'bi-moon'"></i>
      </button>
      
      <!-- Kullanıcı Menüsü -->
      <div class="header-user dropdown">
        <button class="btn user-btn" data-bs-toggle="dropdown" aria-expanded="false">
          <div class="user-avatar">
            <img v-if="userPhotoURL" :src="userPhotoURL" alt="User" />
            <div v-else class="avatar-placeholder">{{ userInitials }}</div>
          </div>
          <span class="user-name">{{ username }}</span>
          <i class="bi bi-chevron-down"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end user-dropdown">
          <li>
            <h6 class="dropdown-header">{{ username }}</h6>
          </li>
          <li><a class="dropdown-item" href="#" @click.prevent="navigateTo('/profile')"><i class="bi bi-person"></i> Profil</a></li>
          <li><a class="dropdown-item" href="#" @click.prevent="navigateTo('/settings')"><i class="bi bi-gear"></i> Ayarlar</a></li>
          <li><a class="dropdown-item" href="#" @click.prevent="navigateTo('/help')"><i class="bi bi-question-circle"></i> Yardım</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" @click.prevent="logout"><i class="bi bi-box-arrow-right"></i> Çıkış Yap</a></li>
        </ul>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed, inject, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useNotificationStore } from '@/store/notification';

export default {
  name: 'AppHeader',
  
  props: {
    username: {
      type: String,
      default: 'Kullanıcı'
    },
    userPhotoURL: {
      type: String,
      default: null
    }
  },
  
  emits: ['toggle-sidebar', 'toggle-dark-mode', 'logout'],
  
  setup(props, { emit }) {
    const router = useRouter();
    const route = useRoute();
    const notificationStore = useNotificationStore();
    
    // Inject
    const isSidebarCollapsed = inject('isSidebarCollapsed');
    const isDarkMode = inject('isDarkMode');
    
    // Şu anki sayfa
    const currentPageTitle = computed(() => {
      return route.meta.title || 'Ana Sayfa';
    });
    
    // Breadcrumbs
    const breadcrumbs = computed(() => {
      const crumbs = [];
      
      // Ana sayfa her zaman var
      crumbs.push({
        title: 'Ana Sayfa',
        path: '/'
      });
      
      // Route'dan breadcrumb oluştur
      const paths = route.path.split('/').filter(Boolean);
      let currentPath = '';
      
      paths.forEach((path, index) => {
        currentPath += `/${path}`;
        // Rotanın meta verisinden başlığı al veya yol adını kullan
        const matchedRoute = router.getRoutes().find(r => r.path === currentPath);
        const title = matchedRoute?.meta?.title || path.charAt(0).toUpperCase() + path.slice(1);
        
        crumbs.push({
          title: title,
          path: currentPath
        });
      });
      
      return crumbs;
    });
    
    // Arama
    const searchQuery = ref('');
    const searchFocused = ref(false);
    const isSearching = ref(false);
    const searchResults = ref([]);
    
    const onSearchBlur = () => {
      // Kullanıcı tıkladığında dropdown'ı kapatmamak için gecikmeli kapat
      setTimeout(() => {
        searchFocused.value = false;
      }, 200);
    };
    
    const clearSearch = () => {
      searchQuery.value = '';
      searchResults.value = [];
    };
    
    const searchInSystem = async (query) => {
      if (!query.trim()) {
        searchResults.value = [];
        return;
      }
      
      isSearching.value = true;
      
      // Demo arama sonuçları - gerçek uygulamada API'den gelecek
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Demo sonuçları
      searchResults.value = [
        {
          id: 1,
          title: `#0424-1251 - AYEDAŞ Siparişi`,
          subtitle: 'Siparişler',
          path: '/orders/0424-1251',
          type: 'order'
        },
        {
          id: 2,
          title: 'RM 36 CB Teknik Şartname',
          subtitle: 'Teknik Dokümanlar',
          path: '/technical?doc=rm36-cb',
          type: 'document'
        },
        {
          id: 3,
          title: 'Siemens 7SR1003-1JA20-2DA0+ZY20',
          subtitle: 'Malzeme',
          path: '/inventory/materials/137998',
          type: 'material'
        }
      ];
      
      isSearching.value = false;
    };
    
    // Search sonuçlarına git
    const navigateToSearchResult = (result) => {
      router.push(result.path);
      clearSearch();
    };
    
    // Arama sonucunun türüne göre icon
    const getSearchResultIcon = (type) => {
      switch (type) {
        case 'order': return 'bi-file-earmark-text';
        case 'document': return 'bi-file-earmark-pdf';
        case 'material': return 'bi-box-seam';
        case 'user': return 'bi-person';
        case 'report': return 'bi-graph-up';
        default: return 'bi-search';
      }
    };
    
    // Arama terimi değişikliğini izle
    watch(searchQuery, (newVal) => {
      if (newVal) {
        searchInSystem(newVal);
      } else {
        searchResults.value = [];
      }
    });
    
    // Bildirimler
    const notifications = computed(() => notificationStore.notifications);
    const unreadNotifications = computed(() => notificationStore.unreadCount);
    
    const readNotification = (notification) => {
      notificationStore.read(notification.id);
      if (notification.link) {
        router.push(notification.link);
      }
    };
    
    const markAllAsRead = () => {
      notificationStore.markAllAsRead();
    };
    
    // Bildirim türüne göre icon
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'success': return 'bi-check-circle';
        case 'danger': return 'bi-exclamation-circle';
        case 'warning': return 'bi-exclamation-triangle';
        case 'info': return 'bi-info-circle';
        default: return 'bi-bell';
      }
    };
    
    // Zaman formatı
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 60) {
        return `${diffMinutes} dakika önce`;
      } else if (diffHours < 24) {
        return `${diffHours} saat önce`;
      } else if (diffDays < 7) {
        return `${diffDays} gün önce`;
      } else {
        return date.toLocaleDateString('tr-TR');
      }
    };
    
    // Demo bildirimleri yükle
    const loadDemoNotifications = () => {
      const now = new Date();
      
      // Demo bildirimler ekle
      notificationStore.add({
        title: 'Geciken Sipariş',
        message: 'Sipariş #0424-1251 teslim tarihi geçti.',
        type: 'danger',
        timestamp: new Date(now.getTime() - 30 * 60000), // 30 dakika önce
        link: '/orders/0424-1251',
        read: false
      });
      
      notificationStore.add({
        title: 'Kritik stok seviyesi',
        message: 'Siemens 7SR1003 röle stok seviyesi kritik.',
        type: 'warning',
        timestamp: new Date(now.getTime() - 4 * 60 * 60000), // 4 saat önce
        link: '/inventory/materials',
        read: false
      });
      
      notificationStore.add({
        title: 'Yeni sipariş',
        message: 'TEİAŞ\'tan yeni sipariş alındı.',
        type: 'info',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60000), // 2 gün önce
        link: '/orders',
        read: true
      });
    };
    
    // Fonksiyonlar
    const toggleSidebar = () => {
      emit('toggle-sidebar');
    };
    
    const toggleDarkMode = () => {
      emit('toggle-dark-mode');
    };
    
    const logout = () => {
      emit('logout');
    };
    
    const navigateTo = (path) => {
      router.push(path);
    };
    
    // Kullanıcı baş harfleri
    const userInitials = computed(() => {
      if (!props.username) return 'U';
      const names = props.username.split(' ');
      if (names.length === 1) {
        return names[0].charAt(0).toUpperCase();
      }
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    });
    
    // Component mounted
    onMounted(() => {
      // Demo bildirimler yükle
      loadDemoNotifications();
    });
    
    return {
      currentPageTitle,
      breadcrumbs,
      searchQuery,
      searchFocused,
      isSearching,
      searchResults,
      onSearchBlur,
      clearSearch,
      navigateToSearchResult,
      getSearchResultIcon,
      notifications,
      unreadNotifications,
      readNotification,
      markAllAsRead,
      getNotificationIcon,
      formatTime,
      toggleSidebar,
      toggleDarkMode,
      logout,
      navigateTo,
      isSidebarCollapsed,
      isDarkMode,
      userInitials
    };
  }
};
</script>

<style lang="scss" scoped>
.app-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-header);
  
  .header-left {
    display: flex;
    align-items: center;
    
    .toggle-sidebar-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      
      i {
        font-size: 1.25rem;
      }
    }
    
    .page-title {
      h1 {
        font-size: 1.25rem;
        margin: 0;
        color: var(--text-primary);
      }
      
      .breadcrumb {
        margin: 0;
        font-size: 0.85rem;
        
        .breadcrumb-item {
          + .breadcrumb-item::before {
            font-family: bootstrap-icons;
            content: "\F285";
            color: var(--text-muted);
            font-size: 0.7rem;
          }
          
          a {
            color: var(--text-muted);
            text-decoration: none;
            
            &:hover {
              color: var(--primary);
            }
          }
          
          &.active {
            color: var(--text-secondary);
          }
        }
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    
    > * {
      margin-left: 0.5rem;
    }
    
    .header-search {
      position: relative;
      width: 250px;
      
      .search-wrapper {
        position: relative;
        
        input {
          width: 100%;
          padding: 0.5rem 2.25rem 0.5rem 2rem;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: all 0.3s;
          
          &:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 0.2rem rgba(var(--primary-rgb), 0.25);
          }
        }
        
        i {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 0.875rem;
          
          &.bi-search {
            left: 0.75rem;
          }
          
          &.bi-x-circle {
            right: 0.75rem;
            cursor: pointer;
            
            &:hover {
              color: var(--text-secondary);
            }
          }
        }
      }
      
      .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        width: 320px;
        margin-top: 0.5rem;
        background-color: var(--bg-dropdown);
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        z-index: 1000;
        
        .search-results-content {
          max-height: 350px;
          overflow-y: auto;
        }
        
        .search-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          color: var(--text-secondary);
          
          .spinner-border {
            margin-right: 0.5rem;
          }
        }
        
        .search-no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          color: var(--text-secondary);
          
          i {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
          }
        }
        
        .search-results-list {
          .search-result-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-bottom: 1px solid var(--border-color);
            
            &:last-child {
              border-bottom: none;
            }
            
            &:hover {
              background-color: var(--bg-hover);
            }
            
            i {
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              background-color: rgba(var(--primary-rgb), 0.1);
              color: var(--primary);
              margin-right: 0.75rem;
            }
            
            .search-result-info {
              flex: 1;
              
              .search-result-title {
                font-weight: 500;
                color: var(--text-primary);
                margin-bottom: 0.25rem;
              }
              
              .search-result-subtitle {
                font-size: 0.75rem;
                color: var(--text-secondary);
              }
            }
          }
        }
      }
    }
    
    .header-notifications {
      position: relative;
      
      .notification-badge {
        position: absolute;
        top: 0;
        right: 0;
        min-width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: var(--danger);
        color: white;
        font-size: 0.65rem;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      }
      
      .notifications-dropdown {
        width: 320px;
        padding: 0;
        
        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          
          h6 {
            margin: 0;
          }
          
          .btn-link {
            color: var(--primary);
            padding: 0;
            font-size: 0.75rem;
            text-decoration: none;
            
            &:hover {
              text-decoration: underline;
            }
          }
        }
        
        .notifications-body {
          max-height: 350px;
          overflow-y: auto;
          
          .notifications-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
            color: var(--text-secondary);
            
            i {
              font-size: 2rem;
              margin-bottom: 0.5rem;
            }
          }
          
          .notification-item {
            display: flex;
            align-items: flex-start;
            padding: 0.75rem 1rem;
            border-left: 3px solid transparent;
            
            &.unread {
              background-color: rgba(var(--primary-rgb), 0.05);
              border-left-color: var(--primary);
            }
            
            &:hover {
              background-color: var(--bg-hover);
            }
            
            .notification-icon {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 0.75rem;
              flex-shrink: 0;
              
              i {
                color: white;
              }
              
              &.bg-success {
                background-color: var(--success);
              }
              
              &.bg-danger {
                background-color: var(--danger);
              }
              
              &.bg-warning {
                background-color: var(--warning);
              }
              
              &.bg-info {
                background-color: var(--info);
              }
              
              &.bg-primary {
                background-color: var(--primary);
              }
            }
            
            .notification-content {
              flex: 1;
              
              .notification-title {
                font-weight: 500;
                color: var(--text-primary);
                margin-bottom: 0.25rem;
              }
              
              .notification-text {
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-bottom: 0.25rem;
              }
              
              .notification-time {
                font-size: 0.75rem;
                color: var(--text-muted);
              }
            }
          }
        }
      }
    }
    
    .btn-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: transparent;
      color: var(--text-secondary);
      border: none;
      position: relative;
      
      i {
        font-size: 1.25rem;
      }
      
      &:hover {
        background-color: var(--bg-hover);
        color: var(--text-primary);
      }
    }
    
    .header-user {
      position: relative;
      
      .user-btn {
        display: flex;
        align-items: center;
        background-color: transparent;
        border: none;
        padding: 0.25rem 0.5rem;
        margin-left: 0.5rem;
        border-radius: 0.25rem;
        
        &:hover {
          background-color: var(--bg-hover);
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          margin-right: 0.5rem;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .avatar-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--primary);
            color: white;
            font-weight: 600;
            font-size: 1rem;
          }
        }
        
        .user-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-right: 0.25rem;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        i {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
      
      .user-dropdown {
        width: 200px;
        
        .dropdown-item {
          display: flex;
          align-items: center;
          
          i {
            margin-right: 0.5rem;
            width: 20px;
            text-align: center;
          }
        }
      }
    }
  }
}

// Responsive Styles
@media (max-width: 992px) {
  .app-header {
    .header-search {
      width: 200px;
    }
  }
}

@media (max-width: 768px) {
  .app-header {
    .page-title {
      .breadcrumb {
        display: none;
      }
    }
    
    .header-search {
      display: none;
    }
    
    .header-user {
      .user-btn {
        .user-name {
          display: none;
        }
      }
    }
  }
}
</style>