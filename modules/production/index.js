/**
 * Production Module - Main entry point for production management functionality
 * Provides production planning, tracking, and analysis capabilities
 */

import { apiService } from '@/services/api-service';
import { erpService } from '@/services/erp-service';
import { aiService } from '@/services/ai-service';

class ProductionModule {
  constructor() {
    this.initialized = false;
    this.productionData = {
      schedule: [],
      resources: [],
      activeProduction: [],
      plannedProduction: [],
      capacityLoad: {},
      estimatedDeliveries: []
    };
  }

  /**
   * Initialize the production module
   * @returns {Promise<boolean>} Success state
   */
  async init() {
    try {
      if (this.initialized) {
        console.log('Production module already initialized');
        return true;
      }

      console.log('Initializing production module...');
      
      // Load production data
      await this.loadProductionData();
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing production module:', error);
      return false;
    }
  }

  /**
   * Load production data from API or ERP service
   * @returns {Promise<Object>} Production data
   */
  async loadProductionData() {
    try {
      // Try to load from API first
      try {
        const [scheduleData, resourceData, activeData] = await Promise.all([
          apiService.get('/production/schedule'),
          apiService.get('/production/resources'),
          apiService.get('/production/active')
        ]);
        
        this.productionData.schedule = scheduleData?.schedule || [];
        this.productionData.resources = resourceData?.resources || [];
        this.productionData.activeProduction = activeData?.production || [];
        
      } catch (apiError) {
        console.log('API service error, falling back to ERP service...', apiError);
        
        // Fallback to ERP service
        const erpData = await erpService.getProductionData();
        
        if (erpData && !erpData.error) {
          this.productionData = {
            ...this.productionData,
            ...erpData
          };
        } else {
          throw new Error('Failed to load production data from ERP service');
        }
      }
      
      // Process production data
      this.processProductionData();
      
      return this.productionData;
    } catch (error) {
      console.error('Error loading production data:', error);
      
      // Generate demo data if no data is available
      this.generateDemoData();
      return this.productionData;
    }
  }

  /**
   * Process production data to calculate additional information
   */
  processProductionData() {
    // Calculate capacity utilization by resource
    this.productionData.capacityLoad = this.productionData.resources.reduce((acc, resource) => {
      const resourceLoad = this.calculateResourceLoad(resource.id);
      acc[resource.id] = {
        id: resource.id,
        name: resource.name,
        capacity: resource.capacity,
        used: resourceLoad.used,
        available: resource.capacity - resourceLoad.used,
        utilization: (resourceLoad.used / resource.capacity) * 100
      };
      
      return acc;
    }, {});
    
    // Calculate estimated delivery dates for orders in production
    this.calculateEstimatedDeliveries();
  }
  
  /**
   * Calculate the load on a specific resource
   * @param {string} resourceId - Resource ID
   * @returns {Object} Load information
   */
  calculateResourceLoad(resourceId) {
    const activeItems = this.productionData.activeProduction.filter(item => 
      item.resourceId === resourceId
    );
    
    let used = activeItems.reduce((sum, item) => {
      return sum + (item.hoursRequired || 0);
    }, 0);
    
    return {
      used,
      count: activeItems.length
    };
  }
  
  /**
   * Calculate estimated delivery dates based on production schedule
   */
  calculateEstimatedDeliveries() {
    const estimates = [];
    const activeOrderIds = new Set(this.productionData.activeProduction.map(item => item.orderId));
    
    // Filter out duplicate orders
    activeOrderIds.forEach(orderId => {
      const orderItems = this.productionData.activeProduction.filter(item => item.orderId === orderId);
      
      if (orderItems.length > 0) {
        // Find the latest task completion date
        const latestCompletion = orderItems.reduce((latest, item) => {
          const endDate = item.endDate ? new Date(item.endDate) : null;
          if (endDate && (!latest || endDate > latest)) {
            return endDate;
          }
          return latest;
        }, null);
        
        if (latestCompletion) {
          const order = orderItems[0]; // Take basic info from first item
          
          estimates.push({
            orderId: orderId,
            orderNumber: order.orderNumber,
            customer: order.customer,
            originalDeliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : null,
            estimatedDeliveryDate: latestCompletion,
            isDelayed: order.deliveryDate && latestCompletion > new Date(order.deliveryDate)
          });
        }
      }
    });
    
    this.productionData.estimatedDeliveries = estimates;
    return estimates;
  }
  
  /**
   * Update production schedule with new schedule data
   * @param {Object} scheduleData - New schedule data
   * @returns {Promise<Object>} Updated schedule
   */
  async updateProductionSchedule(scheduleData) {
    try {
      // Try API service first
      try {
        const response = await apiService.put('/production/schedule', scheduleData);
        
        // Update local data
        this.productionData.schedule = response.schedule || scheduleData;
        this.processProductionData();
        
        return response;
      } catch (apiError) {
        console.log('API service error, falling back to ERP service...', apiError);
      }
      
      // Fallback to ERP service if API fails
      if (erpService.updateProductionSchedule) {
        const response = await erpService.updateProductionSchedule(scheduleData);
        
        if (response && !response.error) {
          this.productionData.schedule = response.schedule || scheduleData;
          this.processProductionData();
          return response;
        } else {
          throw new Error(response?.error || 'Failed to update production schedule');
        }
      } else {
        // Just update local data if no service is available
        this.productionData.schedule = scheduleData;
        this.processProductionData();
        return { success: true, schedule: scheduleData };
      }
    } catch (error) {
      console.error('Error updating production schedule:', error);
      throw error;
    }
  }
  
  /**
   * Update a production task with new status or data
   * @param {string} taskId - Task ID
   * @param {Object} taskData - New task data
   * @returns {Promise<Object>} Updated task
   */
  async updateProductionTask(taskId, taskData) {
    try {
      if (!taskId) {
        throw new Error('Task ID is required');
      }
      
      // Try API service first
      try {
        const response = await apiService.put(`/production/tasks/${taskId}`, taskData);
        
        // Update local data
        this.updateLocalTask(taskId, taskData);
        this.processProductionData();
        
        return response;
      } catch (apiError) {
        console.log('API service error, falling back to ERP service...', apiError);
      }
      
      // Fallback to ERP service if API fails
      if (erpService.updateProductionTask) {
        const response = await erpService.updateProductionTask(taskId, taskData);
        
        if (response && !response.error) {
          this.updateLocalTask(taskId, taskData);
          this.processProductionData();
          return response;
        } else {
          throw new Error(response?.error || 'Failed to update production task');
        }
      } else {
        // Just update local data if no service is available
        this.updateLocalTask(taskId, taskData);
        this.processProductionData();
        return { success: true, taskId, ...taskData };
      }
    } catch (error) {
      console.error(`Error updating production task ${taskId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update a task in the local data store
   * @param {string} taskId - Task ID
   * @param {Object} taskData - New task data
   */
  updateLocalTask(taskId, taskData) {
    // Update in schedule
    const scheduleIndex = this.productionData.schedule.findIndex(task => task.id === taskId);
    if (scheduleIndex !== -1) {
      this.productionData.schedule[scheduleIndex] = {
        ...this.productionData.schedule[scheduleIndex],
        ...taskData
      };
    }
    
    // Update in active production
    const activeIndex = this.productionData.activeProduction.findIndex(task => task.id === taskId);
    if (activeIndex !== -1) {
      this.productionData.activeProduction[activeIndex] = {
        ...this.productionData.activeProduction[activeIndex],
        ...taskData
      };
    }
  }
  
  /**
   * Generate an optimal production plan using AI
   * @param {Object} options - Planning options
   * @returns {Promise<Object>} Generated production plan
   */
  async generateOptimalPlan(options = {}) {
    try {
      // Use AI service if available
      if (aiService && aiService.analyzeProduction) {
        try {
          const productionData = {
            resources: this.productionData.resources,
            pendingOrders: options.orders || [],
            currentSchedule: this.productionData.schedule,
            activeProduction: this.productionData.activeProduction,
            preferences: options.preferences || {}
          };
          
          const analysis = await aiService.analyzeProduction(productionData);
          
          if (analysis && analysis.success) {
            // If successful, return the recommendations
            return {
              success: true,
              schedule: analysis.recommendations?.schedule || [],
              insights: analysis.insights || [],
              risks: analysis.riskAreas || []
            };
          }
        } catch (aiError) {
          console.warn('AI production planning failed, falling back to basic planning', aiError);
        }
      }
      
      // Fallback to basic planning logic
      const plan = this.generateBasicPlan(options.orders || []);
      return {
        success: true,
        schedule: plan,
        insights: [],
        risks: []
      };
    } catch (error) {
      console.error('Error generating production plan:', error);
      throw error;
    }
  }
  
  /**
   * Generate a basic production plan without AI
   * @param {Array} orders - Orders to plan
   * @returns {Array} Generated production plan
   */
  generateBasicPlan(orders) {
    // Create a new schedule based on order priorities and deadlines
    const newSchedule = [...orders].sort((a, b) => {
      // Sort by priority first (high to low)
      const priorityOrder = { high: 1, medium: 2, low: 3, normal: 2 };
      const priorityA = priorityOrder[a.priority] || 2;
      const priorityB = priorityOrder[b.priority] || 2;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Then by delivery date (early to late)
      const dateA = a.deliveryDate ? new Date(a.deliveryDate) : new Date(9999, 11, 31);
      const dateB = b.deliveryDate ? new Date(b.deliveryDate) : new Date(9999, 11, 31);
      
      return dateA - dateB;
    }).map(order => {
      // Estimated production time based on cell type and quantity
      const estimationBase = {
        'rm 36 cb': 7, // 7 days per unit
        'rm 36 lb': 6,
        'rm 36 fl': 8,
        'default': 10
      };
      
      const cellType = order.cellType ? order.cellType.toLowerCase() : 'default';
      const baseTime = estimationBase[cellType] || estimationBase.default;
      const quantity = order.quantity || order.cellCount || 1;
      
      // Scale for quantity (not linear)
      const estimatedDays = Math.ceil(baseTime * (1 + (quantity - 1) * 0.6));
      
      // Create a basic schedule entry
      return {
        id: `task-${order.id || order.orderId}`,
        orderId: order.id || order.orderId,
        orderNumber: order.orderNumber,
        customer: order.customer,
        description: `${order.cellType || 'Hücre'} Üretimi`,
        estimatedDays,
        priority: order.priority || 'normal',
        status: 'pending'
      };
    });
    
    return newSchedule;
  }
  
  /**
   * Generate demo production data for testing
   */
  generateDemoData() {
    // Demo resources
    this.productionData.resources = [
      { id: 'elektrik_tasarim', name: 'Elektrik Tasarım', capacity: 160 },
      { id: 'mekanik_tasarim', name: 'Mekanik Tasarım', capacity: 120 },
      { id: 'satin_alma', name: 'Satın Alma', capacity: 80 },
      { id: 'mekanik_uretim', name: 'Mekanik Üretim', capacity: 200 },
      { id: 'ic_montaj', name: 'İç Montaj', capacity: 240 },
      { id: 'kablaj', name: 'Kablaj', capacity: 320 },
      { id: 'genel_montaj', name: 'Genel Montaj', capacity: 280 },
      { id: 'test', name: 'Test', capacity: 160 }
    ];
    
    // Demo active production
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    this.productionData.activeProduction = [
      {
        id: 'task-1',
        orderId: 'order-1',
        orderNumber: '24-03-A001',
        customer: 'AYEDAŞ',
        resourceId: 'ic_montaj',
        description: 'İç montaj işlemleri',
        startDate: today,
        endDate: nextWeek,
        progress: 65,
        hoursRequired: 48,
        deliveryDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'task-2',
        orderId: 'order-2',
        orderNumber: '24-03-B002',
        customer: 'BAŞKENT EDAŞ',
        resourceId: 'mekanik_uretim',
        description: 'Mekanik üretim',
        startDate: today,
        endDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        progress: 30,
        hoursRequired: 56,
        deliveryDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Process the demo data
    this.processProductionData();
  }
  
  /**
   * Analyze production delays and recommend recovery actions
   * @returns {Promise<Object>} Delay analysis and recommendations
   */
  async analyzeDelays() {
    try {
      // Use AI service if available
      if (aiService && aiService.analyzeProduction) {
        try {
          const productionData = {
            resources: this.productionData.resources,
            schedule: this.productionData.schedule,
            activeProduction: this.productionData.activeProduction,
            estimatedDeliveries: this.productionData.estimatedDeliveries
          };
          
          const analysis = await aiService.analyzeProduction(productionData);
          
          if (analysis && analysis.success) {
            return {
              success: true,
              delayedOrders: this.getDelayedOrders(),
              recommendations: analysis.recommendations || [],
              insights: analysis.insights || []
            };
          }
        } catch (aiError) {
          console.warn('AI delay analysis failed, falling back to basic analysis', aiError);
        }
      }
      
      // Basic delay analysis
      const delayedOrders = this.getDelayedOrders();
      
      return {
        success: true,
        delayedOrders,
        recommendations: this.generateBasicDelayRecommendations(delayedOrders),
        insights: []
      };
    } catch (error) {
      console.error('Error analyzing production delays:', error);
      throw error;
    }
  }
  
  /**
   * Get list of delayed orders
   * @returns {Array} Delayed orders
   */
  getDelayedOrders() {
    return this.productionData.estimatedDeliveries
      .filter(e => e.isDelayed)
      .map(e => {
        // Find related production tasks
        const tasks = this.productionData.activeProduction.filter(t => t.orderId === e.orderId);
        
        // Determine which department is causing the delay
        let delayedDepartment = '';
        if (tasks.length > 0) {
          // Find the task with the highest remaining work
          const mostDelayedTask = [...tasks].sort((a, b) => {
            const remainingA = 100 - (a.progress || 0);
            const remainingB = 100 - (b.progress || 0);
            return remainingB - remainingA;
          })[0];
          
          // Find the resource name
          if (mostDelayedTask.resourceId) {
            const resource = this.productionData.resources.find(r => r.id === mostDelayedTask.resourceId);
            delayedDepartment = resource ? resource.name : mostDelayedTask.resourceId;
          }
        }
        
        // Calculate delay in days
        const today = new Date();
        const originalDate = e.originalDeliveryDate || today;
        const estimatedDate = e.estimatedDeliveryDate || today;
        const delayDays = Math.ceil((estimatedDate - originalDate) / (1000 * 60 * 60 * 24));
        
        return {
          orderId: e.orderId,
          orderNumber: e.orderNumber,
          customer: e.customer,
          originalDeliveryDate: e.originalDeliveryDate,
          estimatedDeliveryDate: e.estimatedDeliveryDate,
          delayDays: Math.max(0, delayDays),
          delayedDepartment,
          canRecoverWithOvertime: delayDays <= 7 // Simple rule: can recover if delay is ≤ 7 days
        };
      });
  }
  
  /**
   * Generate basic recommendations for addressing delays
   * @param {Array} delayedOrders - List of delayed orders
   * @returns {Array} Recommendations
   */
  generateBasicDelayRecommendations(delayedOrders) {
    const recommendations = [];
    
    if (delayedOrders.length === 0) {
      return ['Şu anda geciken sipariş bulunmamaktadır.'];
    }
    
    // Group by department to identify bottlenecks
    const departmentDelays = {};
    delayedOrders.forEach(order => {
      if (!order.delayedDepartment) return;
      
      if (!departmentDelays[order.delayedDepartment]) {
        departmentDelays[order.delayedDepartment] = [];
      }
      
      departmentDelays[order.delayedDepartment].push(order);
    });
    
    // Generate department-specific recommendations
    Object.entries(departmentDelays).forEach(([dept, orders]) => {
      if (orders.length >= 3) {
        recommendations.push(`${dept} bölümünde bir kapasite darboğazı tespit edildi. Ek personel veya vardiya planlanabilir.`);
      } else if (orders.length > 0) {
        recommendations.push(`${dept} bölümünde ${orders.length} siparişte gecikme mevcut. Öncelik sıralaması gözden geçirilebilir.`);
      }
    });
    
    // Overtime recommendations for recoverable delays
    const recoverableOrders = delayedOrders.filter(o => o.canRecoverWithOvertime);
    if (recoverableOrders.length > 0) {
      recommendations.push(`${recoverableOrders.length} siparişin gecikmesi ek mesai ile telafi edilebilir.`);
    }
    
    // General recommendations
    if (delayedOrders.length > 5) {
      recommendations.push('Üretim planı gözden geçirilmeli, sipariş öncelikleri yeniden değerlendirilmelidir.');
    }
    
    return recommendations;
  }
}

// Create and export a singleton instance
const productionModule = new ProductionModule();
export default productionModule;