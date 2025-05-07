import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

// Layouts
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import BlankLayout from '@/layouts/BlankLayout.vue';

// Helper function to handle imports with fallbacks
const safeImport = (path) => {
  return () => import(path).catch(() => {
    console.error(`Failed to load component: ${path}`);
    return import('@/components/NotFound.vue');
  });
};

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: safeImport('@/modules/dashboard/views/DashboardView.vue'),
        meta: { title: 'Ana Panel' }
      },
      
      // Orders Module Routes
      {
        path: 'orders',
        name: 'Orders',
        component: safeImport('@/modules/orders/views/OrderListView.vue'),
        meta: { title: 'Siparişler' }
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: safeImport('@/modules/orders/views/OrderCreationView.vue'),
        meta: { title: 'Yeni Sipariş' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: safeImport('@/modules/orders/views/OrderDetailView.vue'),
        props: true,
        meta: { title: 'Sipariş Detayı' }
      },
      
      // Production Module Routes
      {
        path: 'production',
        name: 'Production',
        component: safeImport('@/modules/production/views/ProductionView.vue'),
        meta: { title: 'Üretim' }
      },
      {
        path: 'production/planning',
        name: 'ProductionPlanning',
        component: safeImport('@/modules/planning/views/PlanningView.vue'),
        meta: { title: 'Üretim Planlaması' }
      },
      {
        path: 'production/monitoring',
        name: 'ProductionMonitoring',
        component: safeImport('@/modules/production/views/ProductionView.vue'),
        meta: { title: 'Üretim İzleme' }
      },
      
      // Inventory Module Routes
      {
        path: 'inventory',
        name: 'Inventory',
        component: safeImport('@/modules/inventory/views/InventoryView.vue'),
        meta: { title: 'Envanter' }
      },
      {
        path: 'inventory/stock',
        name: 'Stock',
        component: safeImport('@/modules/inventory/views/InventoryView.vue'), // Use InventoryView for now
        meta: { title: 'Stok Yönetimi' }
      },
      {
        path: 'inventory/materials',
        name: 'Materials',
        component: safeImport('@/modules/materials/views/MaterialListView.vue'),
        meta: { title: 'Malzeme Yönetimi' }
      },
      
      // Purchasing Module Routes
      {
        path: 'purchasing',
        name: 'Purchasing',
        component: safeImport('@/modules/purchasing/views/PurchasingView.vue'),
        meta: { title: 'Satın Alma' }
      },
      {
        path: 'purchasing/suppliers',
        name: 'Suppliers',
        component: safeImport('@/modules/purchasing/views/PurchasingView.vue'),
        meta: { title: 'Tedarikçiler' }
      },
      
      // Technical Module Route
      {
        path: 'technical',
        name: 'Technical',
        component: safeImport('@/modules/technical/views/TechnicalView.vue'),
        meta: { title: 'Teknik Veri' }
      },
      
      // Planning Module Route
      {
        path: 'planning',
        name: 'Planning',
        component: safeImport('@/modules/planning/views/PlanningView.vue'),
        meta: { title: 'Planlama' }
      },
      
      // Reports Module Routes
      {
        path: 'reports',
        name: 'Reports',
        component: safeImport('@/modules/reports/views/ReportsView.vue'),
        meta: { title: 'Raporlar' }
      },
      {
        path: 'reports/orders',
        name: 'OrderReports',
        component: safeImport('@/modules/reports/views/ReportsView.vue'),
        meta: { title: 'Sipariş Raporları', reportType: 'orders' }
      },
      {
        path: 'reports/production',
        name: 'ProductionReports',
        component: safeImport('@/modules/reports/views/ReportsView.vue'),
        meta: { title: 'Üretim Raporları', reportType: 'production' }
      },
      
      // User Management and Settings (Admin Only)
      {
        path: 'users',
        name: 'UserManagement',
        component: safeImport('@/modules/settings/views/SettingsView.vue'),
        meta: { title: 'Kullanıcı Yönetimi', requiredRole: 'admin', settingsType: 'users' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: safeImport('@/modules/settings/views/SettingsView.vue'),
        meta: { title: 'Ayarlar', requiredRole: 'admin', settingsType: 'general' }
      },
      
      // Help Page
      {
        path: 'help',
        name: 'Help',
        component: safeImport('@/modules/settings/views/HelpView.vue'), 
        meta: { title: 'Yardım' }
      },
      
      // Fallback için - eğer alt sayfa bulunamazsa dashboard'a yönlendir
      {
        path: ':pathMatch(.*)*',
        redirect: { name: 'Home' }
      }
    ]
  },
  {
    path: '/auth',
    component: BlankLayout,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: safeImport('@/modules/auth/views/LoginView.vue'),
        meta: { title: 'Giriş Yap' }
      },
      {
        path: 'register',
        name: 'Register',
        component: safeImport('@/modules/auth/views/LoginView.vue'),
        meta: { title: 'Kayıt Ol' }
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: safeImport('@/modules/auth/views/LoginView.vue'),
        meta: { title: 'Şifremi Unuttum' }
      },
      // Auth fallback
      {
        path: ':pathMatch(.*)*',
        redirect: { name: 'Login' }
      }
    ]
  },
  // Basit login yolunu /auth/login'e yönlendir
  {
    path: '/login',
    redirect: '/auth/login'
  },
  // Catchall 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/components/NotFound.vue'),
    meta: { layout: 'blank', title: 'Sayfa Bulunamadı' }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

router.beforeEach(async (to, from, next) => {
  // Get the auth store - burada doğrudan useAuthStore() yerine bir callback kullanıyoruz
  // çünkü router setup sırasında store henüz oluşturulmamış olabilir
  const getAuthStore = () => {
    try {
      return useAuthStore();
    } catch (error) {
      console.error('Auth store henüz hazır değil:', error);
      return {
        isAuthenticated: false,
        userRole: 'user'
      };
    }
  };
  
  // Sayfa başlığını güncelle
  const nearestWithTitle = to.matched.slice().reverse().find(r => r.meta && r.meta.title);
  if (nearestWithTitle) {
    document.title = `${nearestWithTitle.meta.title} | MehmetEndüstriyelTakip`;
  } else {
    document.title = 'MehmetEndüstriyelTakip';
  }
  
  // Demo mod kontrolü (geliştirme ortamında otomatik giriş için)
  const isDemoMode = import.meta.env.DEV || to.query.demo === 'true';
  
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Auth store'u al
    const authStore = getAuthStore();
    
    // Demo mod ise ve login gerekmiyorsa özel işlem
    if (isDemoMode && !to.path.includes('/auth/') && !authStore.isAuthenticated) {
      console.log('Demo mod otomatik yönlendirme');
      // Demo için kimlik doğrulama işlemini tamamla ve devam et
      next();
      return;
    }
    
    // Kimlik doğrulama gerekliyse ve kullanıcı oturum açmamışsa
    if (!authStore.isAuthenticated) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }
    
    // Check if the route requires a specific role
    if (to.meta.requiredRole && to.meta.requiredRole !== authStore.userRole) {
      next({ name: 'Home' });
      return;
    }
  }
  
  // Redirect to home if trying to access auth pages while already authenticated
  if (to.path.includes('/auth/')) {
    const authStore = getAuthStore();
    if (authStore.isAuthenticated) {
      next({ name: 'Home' });
      return;
    }
  }
  
  next();
});

export default router;