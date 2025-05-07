/**
 * planning.js - Planning module Pinia store
 * Planning modülünün state yönetimi için store
 */

import { defineStore } from 'pinia';
import { usePlanningService } from '@/modules/planning/usePlanningService';

export const usePlanningStore = defineStore('planning', {
  state: () => ({
    orders: [],
    productionUnits: [],
    schedule: [],
    capacityLoad: {},
    deliveryEstimates: [],
    isLoading: false,
    error: null
  }),

  getters: {
    // Siparişleri önceliklerine göre filtreleme
    highPriorityOrders: (state) => state.orders.filter(order => order.priority === 'high'),
    
    // Teslimatları tarihe göre sıralama
    sortedDeliveries: (state) => [...state.deliveryEstimates].sort(
      (a, b) => new Date(a.estimatedDeliveryDate) - new Date(b.estimatedDeliveryDate)
    ),
    
    // En yüksek yüklü birim
    highestLoadedUnit: (state) => {
      if (!state.productionUnits.length || Object.keys(state.capacityLoad).length === 0) {
        return null;
      }
      
      return state.productionUnits
        .map(unit => ({
          ...unit,
          load: state.capacityLoad[unit.id] || 0,
          percentage: ((state.capacityLoad[unit.id] || 0) / unit.capacity) * 100
        }))
        .sort((a, b) => b.percentage - a.percentage)[0];
    },
    
    // Kapasite yüzdeleri
    capacityPercentages: (state) => {
      const percentages = {};
      state.productionUnits.forEach(unit => {
        const load = state.capacityLoad[unit.id] || 0;
        percentages[unit.id] = Math.min(100, (load / unit.capacity) * 100);
      });
      return percentages;
    }
  },

  actions: {
    /**
     * Planlama verilerini yükle
     */
    async fetchPlanningData() {
      const planningService = usePlanningService();
      
      this.isLoading = true;
      this.error = null;
      
      try {
        const data = await planningService.getPlanningData();
        
        this.orders = data.orders;
        this.productionUnits = data.productionUnits;
        this.schedule = data.schedule;
        this.capacityLoad = data.capacityLoad;
        this.deliveryEstimates = data.deliveryEstimates;
        
        return data;
      } catch (error) {
        this.error = error.message || 'Planlama verileri yüklenemedi';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Planlama parametrelerini güncelle
     * @param {Object} params Güncellenecek parametreler
     */
    async updateParameters(params) {
      const planningService = usePlanningService();
      
      try {
        const result = await planningService.updatePlanningParameters(params);
        // Güncelleme başarılıysa verileri yeniden yükle
        if (result.success) {
          await this.fetchPlanningData();
        }
        return result;
      } catch (error) {
        this.error = error.message || 'Parametreler güncellenemedi';
        throw error;
      }
    }
  }
});