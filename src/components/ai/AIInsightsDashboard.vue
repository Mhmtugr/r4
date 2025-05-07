&lt;template&gt;
  &lt;div class="ai-insights-dashboard"&gt;
    &lt;div class="dashboard-header"&gt;
      &lt;h2&gt;AI Üretim Analizi ve Öneriler&lt;/h2&gt;
      &lt;button @click="refreshInsights" :disabled="isLoading" class="refresh-btn"&gt;
        &lt;i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"&gt;&lt;/i&gt;
        Yenile
      &lt;/button&gt;
    &lt;/div&gt;

    &lt;div v-if="isLoading" class="loading-container"&gt;
      &lt;div class="spinner"&gt;&lt;/div&gt;
      &lt;p&gt;AI analiz oluşturuluyor...&lt;/p&gt;
    &lt;/div&gt;

    &lt;div v-else-if="error" class="error-container"&gt;
      &lt;p&gt;{{ error }}&lt;/p&gt;
      &lt;button @click="refreshInsights" class="retry-btn"&gt;Tekrar Dene&lt;/button&gt;
    &lt;/div&gt;

    &lt;div v-else-if="insights" class="insights-container"&gt;
      &lt;!-- Efficiency Section --&gt;
      &lt;div class="insight-card efficiency"&gt;
        &lt;div class="card-header"&gt;
          &lt;h3&gt;&lt;i class="fas fa-chart-line"&gt;&lt;/i&gt; Üretim Verimliliği&lt;/h3&gt;
        &lt;/div&gt;
        &lt;div class="card-body"&gt;
          &lt;div class="metric-row"&gt;
            &lt;div class="metric"&gt;
              &lt;span class="metric-value"&gt;%{{ insights.efficiencyTrends.currentEfficiency }}&lt;/span&gt;
              &lt;span class="metric-label"&gt;Güncel Verimlilik&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class="metric"&gt;
              &lt;span class="metric-value" :class="getChangeClass(insights.efficiencyTrends.weeklyChange)"&gt;
                {{ insights.efficiencyTrends.weeklyChange }}
              &lt;/span&gt;
              &lt;span class="metric-label"&gt;Haftalık Değişim&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class="metric"&gt;
              &lt;span class="metric-value" :class="getChangeClass(insights.efficiencyTrends.monthlyChange)"&gt;
                {{ insights.efficiencyTrends.monthlyChange }}
              &lt;/span&gt;
              &lt;span class="metric-label"&gt;Aylık Değişim&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;p class="insight-text"&gt;{{ insights.efficiencyTrends.insights }}&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;!-- Bottlenecks Section --&gt;
      &lt;div class="insight-card bottlenecks"&gt;
        &lt;div class="card-header"&gt;
          &lt;h3&gt;&lt;i class="fas fa-exclamation-triangle"&gt;&lt;/i&gt; Darboğazlar&lt;/h3&gt;
        &lt;/div&gt;
        &lt;div class="card-body"&gt;
          &lt;div class="bottleneck-item primary"&gt;
            &lt;span class="bottleneck-label"&gt;Birincil:&lt;/span&gt;
            &lt;span class="bottleneck-value"&gt;{{ insights.bottlenecks.primaryBottleneck }}&lt;/span&gt;
          &lt;/div&gt;
          &lt;div class="bottleneck-item secondary"&gt;
            &lt;span class="bottleneck-label"&gt;İkincil:&lt;/span&gt;
            &lt;span class="bottleneck-value"&gt;{{ insights.bottlenecks.secondaryBottleneck }}&lt;/span&gt;
          &lt;/div&gt;
          &lt;div class="bottleneck-item affected"&gt;
            &lt;span class="bottleneck-label"&gt;Etkilenen Siparişler:&lt;/span&gt;
            &lt;span class="bottleneck-value"&gt;{{ insights.bottlenecks.affectedOrders }}&lt;/span&gt;
          &lt;/div&gt;
          &lt;p class="insight-text"&gt;{{ insights.bottlenecks.insights }}&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;!-- Delayed Orders Section --&gt;
      &lt;div class="insight-card delayed"&gt;
        &lt;div class="card-header"&gt;
          &lt;h3&gt;&lt;i class="fas fa-clock"&gt;&lt;/i&gt; Geciken Siparişler&lt;/h3&gt;
        &lt;/div&gt;
        &lt;div class="card-body"&gt;
          &lt;div class="metric-row"&gt;
            &lt;div class="metric"&gt;
              &lt;span class="metric-value"&gt;{{ insights.delayedOrders.count }}&lt;/span&gt;
              &lt;span class="metric-label"&gt;Gecikmiş Sipariş&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class="metric"&gt;
              &lt;span class="metric-value alert"&gt;%{{ insights.delayedOrders.percentage }}&lt;/span&gt;
              &lt;span class="metric-label"&gt;Tüm Siparişlerin Yüzdesi&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;p&gt;&lt;strong&gt;Gecikme Modeli:&lt;/strong&gt; {{ insights.delayedOrders.patterns }}&lt;/p&gt;
          &lt;p class="insight-text"&gt;{{ insights.delayedOrders.insights }}&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;!-- Material Shortages Section --&gt;
      &lt;div class="insight-card materials"&gt;
        &lt;div class="card-header"&gt;
          &lt;h3&gt;&lt;i class="fas fa-boxes"&gt;&lt;/i&gt; Malzeme Durumu&lt;/h3&gt;
        &lt;/div&gt;
        &lt;div class="card-body"&gt;
          &lt;div class="metric-row"&gt;
            &lt;div class="metric"&gt;
              &lt;span class="metric-value alert"&gt;{{ insights.materialShortages.criticalCount }}&lt;/span&gt;
              &lt;span class="metric-label"&gt;Kritik Malzemeler&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class="metric"&gt;
              &lt;span class="metric-value"&gt;%{{ insights.materialShortages.criticalPercentage }}&lt;/span&gt;
              &lt;span class="metric-label"&gt;Tüm Malzemelerin Yüzdesi&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;div class="critical-materials"&gt;
            &lt;h4&gt;En Kritik Malzemeler:&lt;/h4&gt;
            &lt;ul&gt;
              &lt;li v-for="(material, index) in insights.materialShortages.mostCritical" :key="index"&gt;
                {{ material }}
              &lt;/li&gt;
            &lt;/ul&gt;
          &lt;/div&gt;
          &lt;p class="insight-text"&gt;{{ insights.materialShortages.insights }}&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;!-- Recommendations Section --&gt;
      &lt;div class="insight-card recommendations"&gt;
        &lt;div class="card-header"&gt;
          &lt;h3&gt;&lt;i class="fas fa-lightbulb"&gt;&lt;/i&gt; AI Öneriler&lt;/h3&gt;
        &lt;/div&gt;
        &lt;div class="card-body"&gt;
          &lt;ul class="recommendation-list"&gt;
            &lt;li v-for="(recommendation, index) in insights.recommendations" :key="index"&gt;
              {{ recommendation }}
            &lt;/li&gt;
          &lt;/ul&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;

    &lt;div v-else class="empty-state"&gt;
      &lt;p&gt;AI analizini başlatmak için "Yenile" butonuna tıklayın.&lt;/p&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script&gt;
import { ref, onMounted } from 'vue';
import { useAIService } from '@/modules/ai';
import { useLogger } from '@/utils/logger';

export default {
  name: 'AIInsightsDashboard',
  
  setup() {
    const aiService = useAIService();
    const logger = useLogger();
    
    const insights = ref(null);
    const isLoading = ref(false);
    const error = ref(null);
    
    // Function to get AI insights
    const refreshInsights = async () => {
      isLoading.value = true;
      error.value = null;
      
      try {
        insights.value = await aiService.generateProductionInsights();
        logger.info('AI insights generated successfully');
      } catch (err) {
        logger.error('Error generating AI insights:', err);
        error.value = 'AI analizi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
      } finally {
        isLoading.value = false;
      }
    };
    
    // Helper to determine CSS class for change values
    const getChangeClass = (changeValue) => {
      if (!changeValue) return '';
      
      if (changeValue.includes('+')) {
        return 'positive';
      } else if (changeValue.includes('-')) {
        return 'negative';
      }
      return '';
    };
    
    // Load insights when component is mounted
    onMounted(() => {
      refreshInsights();
    });
    
    return {
      insights,
      isLoading,
      error,
      refreshInsights,
      getChangeClass
    };
  }
}
&lt;/script&gt;

&lt;style lang="scss" scoped&gt;
.ai-insights-dashboard {
  padding: 1rem;
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    h2 {
      margin: 0;
      color: var(--primary-color, #2c3e50);
    }
    
    .refresh-btn {
      padding: 0.5rem 1rem;
      background-color: var(--primary-color, #4c6ef5);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      &:hover {
        background-color: var(--primary-color-dark, #364fc7);
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem;
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: var(--primary-color, #4c6ef5);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }
  
  .error-container {
    text-align: center;
    padding: 2rem;
    background-color: rgba(255, 0, 0, 0.1);
    border-radius: 8px;
    margin-bottom: 1rem;
    
    .retry-btn {
      padding: 0.5rem 1rem;
      background-color: var(--primary-color, #4c6ef5);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
    }
  }
  
  .insights-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    
    .insight-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      
      .card-header {
        padding: 1rem;
        background-color: var(--secondary-color, #e9ecef);
        
        h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          
          i {
            font-size: 1rem;
          }
        }
      }
      
      .card-body {
        padding: 1rem;
      }
      
      .metric-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        
        .metric {
          text-align: center;
          flex: 1;
          
          .metric-value {
            display: block;
            font-size: 1.5rem;
            font-weight: bold;
            
            &.positive {
              color: var(--success-color, #20c997);
            }
            
            &.negative {
              color: var(--danger-color, #fa5252);
            }
            
            &.alert {
              color: var(--warning-color, #fd7e14);
            }
          }
          
          .metric-label {
            font-size: 0.8rem;
            color: #6c757d;
          }
        }
      }
      
      .bottleneck-item {
        margin-bottom: 0.5rem;
        
        .bottleneck-label {
          font-weight: bold;
          margin-right: 0.5rem;
        }
        
        &.primary .bottleneck-value {
          color: var(--danger-color, #fa5252);
        }
        
        &.secondary .bottleneck-value {
          color: var(--warning-color, #fd7e14);
        }
      }
      
      .critical-materials {
        h4 {
          font-size: 1rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        ul {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          
          li {
            color: var(--danger-color, #fa5252);
          }
        }
      }
      
      .recommendation-list {
        padding-left: 1.5rem;
        
        li {
          margin-bottom: 0.75rem;
        }
      }
      
      .insight-text {
        font-style: italic;
        color: #495057;
        margin-top: 0.5rem;
      }
    }
    
    // Special styling for specific cards
    .efficiency {
      grid-column: span 2;
    }
    
    .recommendations {
      grid-column: span 2;
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    background-color: #f8f9fa;
    border-radius: 8px;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .insights-container {
    .insight-card {
      grid-column: 1 / -1 !important;
    }
    
    .metric-row {
      flex-direction: column;
      
      .metric {
        margin-bottom: 1rem;
      }
    }
  }
}
&lt;/style&gt;