<template>
  <aside class="app-sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <img src="@/assets/images/sample-image.jpg" alt="Logo" />
        <span v-if="!isCollapsed">METS</span>
      </div>
      <button class="btn btn-icon toggle-btn" @click="toggleSidebar">
        <i class="bi" :class="isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'"></i>
      </button>
    </div>

    <div class="sidebar-content">
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item" v-for="(item, index) in menuItems" :key="index">
            <router-link
              v-if="!item.children"
              :to="item.path"
              class="nav-link"
              :class="{ 'active': isActive(item.path) }"
            >
              <i class="nav-icon" :class="item.icon"></i>
              <span class="nav-text" v-if="!isCollapsed">{{ item.title }}</span>
              <span v-if="item.badge && !isCollapsed" class="nav-badge" :class="item.badgeType">{{ item.badge }}</span>
            </router-link>
            
            <div v-else class="nav-dropdown">
              <div 
                class="nav-link nav-dropdown-toggle" 
                :class="{ 'active': isChildActive(item) }" 
                @click="toggleDropdown(index)"
              >
                <i class="nav-icon" :class="item.icon"></i>
                <span class="nav-text" v-if="!isCollapsed">{{ item.title }}</span>
                <i class="bi dropdown-icon" :class="expandedItems.includes(index) ? 'bi-chevron-down' : 'bi-chevron-up'" v-if="!isCollapsed"></i>
              </div>
              
              <ul class="nav-dropdown-items" v-show="!isCollapsed && expandedItems.includes(index)">
                <li v-for="(child, childIndex) in item.children" :key="`${index}-${childIndex}`" class="nav-item">
                  <router-link 
                    :to="child.path" 
                    class="nav-link" 
                    :class="{ 'active': isActive(child.path) }"
                  >
                    <i class="nav-icon" :class="child.icon"></i>
                    <span class="nav-text">{{ child.title }}</span>
                    <span v-if="child.badge" class="nav-badge" :class="child.badgeType">{{ child.badge }}</span>
                  </router-link>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    </div>
    
    <div class="sidebar-footer">
      <div class="sidebar-user" v-if="!isCollapsed">
        <div class="user-avatar">
          <img v-if="user?.photoURL" :src="user.photoURL" alt="User" />
          <div v-else class="avatar-placeholder">{{ userInitials }}</div>
        </div>
        <div class="user-info">
          <div class="user-name">{{ user?.displayName || 'Kullanıcı' }}</div>
          <div class="user-role">{{ user?.role || 'Kullanıcı' }}</div>
        </div>
      </div>
      <div v-else class="collapsed-footer">
        <button class="btn btn-icon">
          <i class="bi bi-gear"></i>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useEventBus, Events } from '@/utils/event-bus';

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-sidebar']);

const authStore = useAuthStore();
const route = useRoute();
const eventBus = useEventBus();

// State
const expandedItems = ref([0]); // Varsayılan olarak ilk menüyü açık tut

// Menu yapısı
const menuItems = ref([
  {
    title: 'Ana Sayfa',
    path: '/',
    icon: 'bi bi-house',
  },
  {
    title: 'Siparişler',
    icon: 'bi bi-cart',
    children: [
      {
        title: 'Sipariş Listesi',
        path: '/orders',
        icon: 'bi bi-list-check',
        badge: '5',
        badgeType: 'badge-primary'
      },
      {
        title: 'Yeni Sipariş',
        path: '/orders/create',
        icon: 'bi bi-plus-circle'
      }
    ]
  },
  {
    title: 'Üretim',
    icon: 'bi bi-gear',
    children: [
      {
        title: 'Üretim Genel',
        path: '/production',
        icon: 'bi bi-gear-wide'
      },
      {
        title: 'Üretim Planlaması',
        path: '/production/planning',
        icon: 'bi bi-calendar-week'
      },
      {
        title: 'Üretim İzleme',
        path: '/production/monitoring',
        icon: 'bi bi-activity'
      }
    ]
  },
  {
    title: 'Envanter',
    icon: 'bi bi-box',
    children: [
      {
        title: 'Envanter Yönetimi',
        path: '/inventory',
        icon: 'bi bi-box-seam'
      },
      {
        title: 'Stok Yönetimi',
        path: '/inventory/stock',
        icon: 'bi bi-boxes'
      },
      {
        title: 'Malzemeler',
        path: '/inventory/materials',
        icon: 'bi bi-tools'
      }
    ]
  },
  {
    title: 'Satın Alma',
    icon: 'bi bi-cart-plus',
    children: [
      {
        title: 'Satın Alma',
        path: '/purchasing',
        icon: 'bi bi-bag'
      },
      {
        title: 'Tedarikçiler',
        path: '/purchasing/suppliers',
        icon: 'bi bi-building'
      }
    ]
  },
  {
    title: 'Teknik',
    path: '/technical',
    icon: 'bi bi-pencil-square'
  },
  {
    title: 'Planlama',
    path: '/planning',
    icon: 'bi bi-calendar-week'
  },
  {
    title: 'Raporlar',
    icon: 'bi bi-graph-up',
    children: [
      {
        title: 'Genel Raporlar',
        path: '/reports',
        icon: 'bi bi-clipboard-data'
      },
      {
        title: 'Sipariş Raporları',
        path: '/reports/orders',
        icon: 'bi bi-file-text'
      },
      {
        title: 'Üretim Raporları',
        path: '/reports/production',
        icon: 'bi bi-bar-chart-line'
      }
    ]
  }
]);

// Computed
const user = computed(() => authStore.user);

const userInitials = computed(() => {
  if (!user.value || !user.value.displayName) return 'U';
  return user.value.displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
});

// Methods
const isActive = (path) => {
  return route.path === path;
};

const isChildActive = (item) => {
  if (!item.children) return false;
  return item.children.some(child => route.path === child.path);
};

const toggleDropdown = (index) => {
  if (expandedItems.value.includes(index)) {
    expandedItems.value = expandedItems.value.filter(i => i !== index);
  } else {
    expandedItems.value.push(index);
  }
};

const toggleSidebar = () => {
  emit('toggle-sidebar');
};

// Eventbus şuanda aktive olanı işaretlemek için
const handleSidebarToggle = () => {
  // Doğru rota seçili değilse açık olan menüyü bul
  if (!expandedItems.value.some(index => {
    const item = menuItems.value[index];
    return item.children && item.children.some(child => child.path === route.path);
  })) {
    // Aktif yolu bul
    menuItems.value.forEach((item, index) => {
      if (item.children && item.children.some(child => child.path === route.path)) {
        if (!expandedItems.value.includes(index)) {
          expandedItems.value.push(index);
        }
      }
    });
  }
};

// Ekran boyutu değişikliklerini izle
const handleResize = () => {
  // Küçük ekranlar için sidebar'ı otomatik kapat
  if (window.innerWidth < 992 && !props.isCollapsed) {
    emit('toggle-sidebar');
  }
};

// Olay dinleyicileri
onMounted(() => {
  eventBus.on(Events.UI_SIDEBAR_TOGGLE, handleSidebarToggle);
  
  // Sayfa ilk yüklendiğinde ve ekran boyutu değiştiğinde
  window.addEventListener('resize', handleResize);
  handleResize();
  
  // Aktif rotaya bağlı olarak menü elemanını aç
  handleSidebarToggle();
});

onUnmounted(() => {
  eventBus.off(Events.UI_SIDEBAR_TOGGLE, handleSidebarToggle);
  window.removeEventListener('resize', handleResize);
});

// Route değişikliklerini izle ve ilgili menü elemanını aç
watch(() => route.path, handleSidebarToggle);
</script>

<style lang="scss">
@use "@/styles/base/variables" as vars;

.app-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 250px;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  z-index: 1000;
  transition: width 0.3s ease;
  
  &.collapsed {
    width: 70px;
    
    .sidebar-header {
      padding: 0;
      justify-content: center;
      
      .logo {
        width: 100%;
        justify-content: center;
        
        img {
          width: 32px;
          height: 32px;
        }
      }
      
      .toggle-btn {
        position: absolute;
        right: 10px;
        top: 16px;
        transform: translateX(0);
      }
    }
    
    .nav-text, 
    .nav-badge,
    .dropdown-icon {
      display: none;
    }
    
    .nav-link {
      justify-content: center;
      padding: 10px;
      
      .nav-icon {
        margin-right: 0;
      }
    }
    
    .nav-dropdown-toggle {
      .dropdown-icon {
        display: none;
      }
    }
  }
  
  .sidebar-header {
    height: 64px;
    display: flex;
    align-items: center;
    padding: 0 1rem;
    border-bottom: 1px solid var(--border-color);
    
    .logo {
      flex: 1;
      display: flex;
      align-items: center;
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary);
      
      img {
        height: 40px;
        margin-right: 0.5rem;
      }
    }
    
    .toggle-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--bg-button);
      color: var(--text-secondary);
      
      &:hover {
        background-color: var(--bg-button-hover);
        color: var(--text-primary);
      }
    }
  }
  
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
    
    .sidebar-nav {
      .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
        
        .nav-item {
          margin-bottom: 0.25rem;
          
          .nav-link {
            display: flex;
            align-items: center;
            padding: 10px 1rem;
            color: var(--text-secondary);
            text-decoration: none;
            border-radius: 0.25rem;
            margin: 0 0.5rem;
            
            &:hover {
              background-color: var(--bg-hover);
              color: var(--text-primary);
            }
            
            &.active {
              background-color: var(--primary-light);
              color: var(--primary);
              font-weight: 500;
            }
            
            .nav-icon {
              font-size: 1.25rem;
              width: 20px;
              text-align: center;
              margin-right: 10px;
            }
            
            .nav-text {
              flex: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .nav-badge {
              padding: 0.15rem 0.4rem;
              font-size: 0.7rem;
              border-radius: 10px;
              font-weight: 600;
              
              &.badge-primary {
                background-color: var(--primary);
                color: white;
              }
              
              &.badge-danger {
                background-color: var(--danger);
                color: white;
              }
              
              &.badge-warning {
                background-color: var(--warning);
                color: var(--dark);
              }
              
              &.badge-success {
                background-color: var(--success);
                color: white;
              }
            }
          }
          
          .nav-dropdown {
            .nav-dropdown-toggle {
              cursor: pointer;
              display: flex;
              align-items: center;
              
              .dropdown-icon {
                margin-left: 0.5rem;
                font-size: 0.75rem;
              }
            }
            
            .nav-dropdown-items {
              list-style: none;
              padding-left: 1rem;
              margin-top: 0.25rem;
              
              .nav-link {
                padding: 8px 1rem;
                font-size: 0.9rem;
              }
            }
          }
        }
      }
    }
  }
  
  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    
    .sidebar-user {
      display: flex;
      align-items: center;
      
      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 0.75rem;
        
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
      
      .user-info {
        overflow: hidden;
        
        .user-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .user-role {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      }
    }
    
    .collapsed-footer {
      display: flex;
      justify-content: center;
      
      .btn-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: var(--bg-button);
        color: var(--text-secondary);
        
        &:hover {
          background-color: var(--bg-button-hover);
          color: var(--text-primary);
        }
      }
    }
  }
}

// Variables for sidebar theme
:root {
  --bg-sidebar: #ffffff;
  --primary-light: rgba(13, 110, 253, 0.15);
  --primary: #0d6efd;
  --danger: #dc3545;
  --warning: #ffc107;
  --success: #198754;
  --dark: #212529;
  --bg-button: #f8f9fa;
  --bg-button-hover: #e9ecef;
  --bg-hover: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-muted: #adb5bd;
  --border-color: #e9ecef;
}

// Dark mode overrides
body.dark-mode {
  --bg-sidebar: #1e2124;
  --primary-light: rgba(45, 136, 255, 0.2);
  --primary: #2d88ff;
  --bg-button: rgba(255, 255, 255, 0.1);
  --bg-button-hover: rgba(255, 255, 255, 0.15);
  --bg-hover: rgba(255, 255, 255, 0.05);
  --text-primary: #e2e2e2;
  --text-secondary: #adb5bd;
  --text-muted: #6c757d;
  --border-color: #343a40;
}

@media (max-width: 992px) {
  .app-sidebar {
    transform: translateX(-100%);
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
    
    &.collapsed {
      transform: translateX(0);
      width: 250px;
      
      .sidebar-header {
        padding: 0 1rem;
        justify-content: space-between;
        
        .logo {
          justify-content: flex-start;
          
          img {
            margin-right: 0.5rem;
          }
          
          span {
            display: block;
          }
        }
      }
      
      .nav-text,
      .nav-badge,
      .dropdown-icon {
        display: block;
      }
      
      .nav-link {
        justify-content: flex-start;
        padding: 10px 1rem;
        
        .nav-icon {
          margin-right: 10px;
        }
      }
    }
  }
}
</style>