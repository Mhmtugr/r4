import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

// Layouts
// import DefaultLayout from '@/layouts/DefaultLayout.vue'; // DefaultLayout zaten App.vue içinde ele alınıyor
// import BlankLayout from '@/layouts/BlankLayout.vue'; // BlankLayout zaten App.vue içinde ele alınıyor

// Views - Örnek olarak bazılarını ekliyorum, diğerleri eklenecek
const Login = () => import('@/views/Login.vue');
const Dashboard = () => import('@/modules/dashboard/views/DashboardHome.vue'); // Varsayılan bir dashboard bileşeni olmalı
const Orders = () => import('@/components/views/Orders.vue'); // <-- YOL DÜZELTİLDİ
const InventoryList = () => import('@/modules/inventory/views/InventoryList.vue'); // Varsayılan bir envanter bileşeni olmalı
const ReportsOverview = () => import('@/views/reports/ReportsOverview.vue'); // Varsayılan bir rapor bileşeni olmalı
const ProductionOverview = () => import('@/modules/production/views/ProductionOverview.vue');
const PlanningDashboard = () => import('@/modules/planning/views/PlanningDashboard.vue');
const TechnicalDocs = () => import('@/modules/technical/views/TechnicalDocs.vue');
const SettingsGeneral = () => import('@/modules/settings/views/SettingsGeneral.vue');
const NotFound = () => import('@/components/NotFound.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { layout: 'blank', requiresAuth: false },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }, // DefaultLayout kullanılacak
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    meta: { requiresAuth: true },
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: InventoryList, // Bu dosyanın var olduğundan emin olun veya uygun bir bileşenle değiştirin
    meta: { requiresAuth: true },
  },
  {
    path: '/reports',
    name: 'Reports',
    component: ReportsOverview, // Bu dosyanın var olduğundan emin olun veya uygun bir bileşenle değiştirin
    meta: { requiresAuth: true },
  },
  {
    path: '/production',
    name: 'Production',
    component: ProductionOverview,
    meta: { requiresAuth: true },
  },
  {
    path: '/planning',
    name: 'Planning',
    component: PlanningDashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/technical',
    name: 'Technical',
    component: TechnicalDocs,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsGeneral,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*', // Herhangi bir eşleşmeyen yol için
    name: 'NotFound',
    component: NotFound,
    meta: { layout: 'blank', requiresAuth: false },
  },
  // Gelecekte eklenecek diğer modüller için örnek rotalar:
  // {
  //   path: '/planning',
  //   name: 'Planning',
  //   component: () => import('@/modules/planning/views/PlanningDashboard.vue'),
  //   meta: { requiresAuth: true },
  // },
  // {
  //   path: '/production',
  //   name: 'Production',
  //   component: () => import('@/modules/production/views/ProductionOverview.vue'),
  //   meta: { requiresAuth: true },
  // },
  // {
  //   path: '/purchasing',
  //   name: 'Purchasing',
  //   component: () => import('@/modules/purchasing/views/PurchasingHome.vue'),
  //   meta: { requiresAuth: true },
  // },
  // {
  //   path: '/settings',
  //   name: 'Settings',
  //   component: () => import('@/modules/settings/views/SettingsGeneral.vue'),
  //   meta: { requiresAuth: true },
  // },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Vite için BASE_URL kullanımı
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  // Pinia store hazır olmadan authStore.user veya isAuthenticated kullanılamaz.
  // Bu yüzden önce checkCurrentSession çağrılmalı veya store'un initialize olması beklenmeli.
  // App.vue içinde zaten bir session kontrolü var, bu yüzden burada tekrar etmeye gerek olmayabilir
  // ancak emin olmak için bir kontrol ekleyebiliriz.

  // Eğer store henüz initialize olmadıysa ve user bilgisi yoksa, session'ı kontrol et
  if (!authStore.user && authStore.checkedSession === false) { // checkedSession gibi bir flag store'da olmalı
      await authStore.checkCurrentSession(); // Bu metodun store'da olduğundan emin olun
  }
  
  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth !== false; // Varsayılan olarak true

  if (requiresAuth && !isAuthenticated) {
    if (to.name !== 'Login') {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  } else if (isAuthenticated && to.name === 'Login') {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
