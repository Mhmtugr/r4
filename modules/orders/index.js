/**
 * orders/index.js
 * Siparişler modülü ana giriş noktası
 */

// Composables
import { useOrders } from './useOrders';
import { useOrderDetail } from './useOrderDetail';
import { useOrderCreation } from './useOrderCreation';

// Views
import OrderListView from './views/OrderListView.vue';
import OrderDetailView from './views/OrderDetailView.vue';
import OrderCreationView from './views/OrderCreationView.vue';

export {
  // Composables
  useOrders,
  useOrderDetail,
  useOrderCreation,
  
  // Views
  OrderListView,
  OrderDetailView,
  OrderCreationView
};