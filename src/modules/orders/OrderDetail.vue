<template>
  <div class="order-detail-page">
    <!-- Yükleniyor göstergesi -->
    <div v-if="isLoading" class="py-5 text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Yükleniyor...</span>
      </div>
      <p class="mt-2">Sipariş bilgileri yükleniyor...</p>
    </div>

    <div v-else>
      <!-- Üst bilgi -->
      <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
          <button @click="goBack" class="btn btn-sm btn-outline-secondary mb-2">
            <i class="bi bi-arrow-left me-1"></i> Geri Dön
          </button>
          <h1 class="mb-1">
            {{ orderNo }} 
            <span v-if="isDelayed" class="badge bg-danger ms-2">Gecikiyor</span>
          </h1>
          <p class="text-muted">{{ customerName }}</p>
        </div>

        <div class="d-flex">
          <div class="dropdown me-2">
            <button class="btn btn-outline-primary dropdown-toggle" type="button" id="orderActionsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-gear me-1"></i> İşlemler
            </button>
            <ul class="dropdown-menu" aria-labelledby="orderActionsDropdown">
              <li><a class="dropdown-item" href="#" @click.prevent="updateOrderStatus('in_progress')"><i class="bi bi-play-fill text-primary me-1"></i> Üretime Başla</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="updateOrderStatus('completed')"><i class="bi bi-check-circle text-success me-1"></i> Tamamlandı Olarak İşaretle</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="updateOrderStatus('delayed')"><i class="bi bi-exclamation-triangle text-warning me-1"></i> Gecikme Bildir</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#"><i class="bi bi-printer me-1"></i> Yazdır</a></li>
              <li><a class="dropdown-item" href="#"><i class="bi bi-file-earmark-excel me-1"></i> Excel'e Aktar</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#"><i class="bi bi-trash me-1"></i> Siparişi Sil</a></li>
            </ul>
          </div>

          <button 
            class="btn btn-primary" 
            @click="performAIAnalysis"
            :disabled="isAnalyzing"
          >
            <i class="bi" :class="isAnalyzing ? 'bi-hourglass' : 'bi-robot'"></i>
            <span v-if="isAnalyzing">AI Analizi Yapılıyor...</span>
            <span v-else>AI Analizi</span>
          </button>
        </div>
      </div>

      <!-- Sipariş durumu -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <div class="mb-3 mb-md-0">
                <label class="form-label d-block small text-muted">Durum</label>
                <span class="badge" :class="orderStatusClass">{{ orderStatusText }}</span>
              </div>
            </div>
            <div class="col-md-3">
              <div class="mb-3 mb-md-0">
                <label class="form-label d-block small text-muted">Sipariş Tarihi</label>
                <span>{{ formatDate(order.orderDate) }}</span>
              </div>
            </div>
            <div class="col-md-3">
              <div class="mb-3 mb-md-0">
                <label class="form-label d-block small text-muted">Teslim Tarihi</label>
                <span :class="{ 'text-danger': isDelayed }">{{ formatDate(order.deliveryDate) }}</span>
              </div>
            </div>
            <div class="col-md-3">
              <div>
                <label class="form-label d-block small text-muted">İlerleme Durumu</label>
                <div class="progress">
                  <div 
                    class="progress-bar" 
                    :class="getProgressBarClass(order.progress)"
                    role="progressbar" 
                    :style="`width: ${order.progress}%`"
                    :aria-valuenow="order.progress" 
                    aria-valuemin="0" 
                    aria-valuemax="100">
                    {{ order.progress }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bildirimler ve uyarılar -->
          <div v-if="hasCriticalNotes || hasWarningNotes" class="mt-3 pt-3 border-top">
            <div v-if="hasCriticalNotes" class="alert alert-danger mb-2">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Kritik Uyarı:</strong> Bu siparişte çözülmemiş kritik sorunlar var.
            </div>
            <div v-if="hasWarningNotes && !hasCriticalNotes" class="alert alert-warning mb-0">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Uyarı:</strong> Bu siparişte çözülmemiş uyarılar var.
            </div>
          </div>
        </div>
      </div>

      <!-- Ana içerik -->
      <div class="row">
        <!-- Sol kolon: Sipariş detayları -->
        <div class="col-md-8">
          <!-- Hücre Bilgileri -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Hücre Bilgileri</h5>
            </div>
            <div class="card-body">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>Hücre Tipi</th>
                    <th>Miktar</th>
                    <th>Özellikler</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(cell, index) in order.cells" :key="index">
                    <td>{{ cell.productTypeCode }}</td>
                    <td>{{ cell.quantity }} adet</td>
                    <td>
                      <div v-if="cell.properties">
                        <ul class="mb-0 ps-3">
                          <li v-for="(value, key) in cell.properties" :key="key">
                            {{ key }}: {{ value }}
                          </li>
                        </ul>
                      </div>
                      <span v-else>-</span>
                    </td>
                    <td>
                      <span class="badge" :class="getCellStatusClass(cell.status)">
                        {{ getCellStatusText(cell.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Üretim Adımları -->
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Üretim Adımları</h5>
              <button class="btn btn-sm btn-outline-primary">
                <i class="bi bi-pencil me-1"></i> Düzenle
              </button>
            </div>
            <div class="card-body">
              <div class="production-timeline">
                <div v-for="(step, index) in productionSteps" :key="index" class="production-step">
                  <div class="step-status">
                    <div class="step-indicator" :class="getStepStatusClass(step.status)">
                      <i :class="getStepStatusIcon(step.status)"></i>
                    </div>
                    <div class="step-line" v-if="index < productionSteps.length - 1"></div>
                  </div>
                  <div class="step-content">
                    <h6 class="mb-1">{{ step.name }}</h6>
                    <div v-if="step.startDate || step.endDate" class="step-dates small text-muted">
                      <span v-if="step.startDate">Başlama: {{ formatDate(step.startDate) }}</span>
                      <span v-if="step.startDate && step.endDate"> - </span>
                      <span v-if="step.endDate">Bitiş: {{ formatDate(step.endDate) }}</span>
                    </div>
                    <p v-if="step.note" class="step-note small mt-1">{{ step.note }}</p>
                    <div class="step-actions mt-2" v-if="!['completed', 'canceled'].includes(step.status)">
                      <button class="btn btn-sm btn-outline-success me-1">
                        <i class="bi bi-check-circle me-1"></i> Tamamlandı
                      </button>
                      <button class="btn btn-sm btn-outline-danger">
                        <i class="bi bi-x-circle me-1"></i> İptal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Malzemeler -->
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Malzemeler</h5>
              <button class="btn btn-sm btn-outline-primary">
                <i class="bi bi-plus-circle me-1"></i> Malzeme Ekle
              </button>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Kod</th>
                      <th>Malzeme Adı</th>
                      <th>Miktar</th>
                      <th>Stok Durumu</th>
                      <th>Tedarik Durumu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="material in relatedMaterials" :key="material.id" :class="getMaterialRowClass(material)">
                      <td>{{ material.code }}</td>
                      <td>{{ material.name }}</td>
                      <td>{{ material.quantity }} {{ material.unit }}</td>
                      <td>
                        <span class="badge" :class="getStockStatusClass(material)">
                          {{ getStockStatusText(material) }}
                        </span>
                      </td>
                      <td>
                        <span v-if="material.supplyStatus">
                          {{ material.supplyStatus }}
                          <span v-if="material.estimatedArrival"> - {{ formatDate(material.estimatedArrival) }}</span>
                        </span>
                        <span v-else>-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Notlar -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Notlar ve Uyarılar</h5>
            </div>
            <div class="card-body">
              <div v-if="notes.length === 0" class="text-center py-3">
                <p class="text-muted mb-0">Bu sipariş için not bulunmuyor.</p>
              </div>
              <ul v-else class="notes-list list-unstyled">
                <li v-for="note in notes" :key="note.id" class="note-item" :class="{'note-resolved': note.resolved}">
                  <div class="note-priority-indicator" :class="`priority-${note.priority}`"></div>
                  <div class="note-content">
                    <div class="note-header d-flex justify-content-between align-items-start">
                      <div>
                        <span class="badge note-priority-badge" :class="getNotePriorityClass(note.priority)">
                          {{ getNotePriorityText(note.priority) }}
                        </span>
                        <span class="ms-2 text-muted small">
                          {{ formatDate(note.createdAt) }} 
                          - 
                          {{ note.createdBy || 'Sistem' }}
                        </span>
                      </div>
                      <div v-if="!note.resolved" class="note-actions">
                        <button class="btn btn-sm btn-outline-success" @click="resolveNote(note.id)">
                          <i class="bi bi-check-circle"></i> Çözüldü
                        </button>
                      </div>
                    </div>
                    <div class="note-text mt-2">
                      {{ note.text }}
                    </div>
                    <div v-if="note.assignedTo" class="note-assignment mt-2 small">
                      <i class="bi bi-person"></i> Atanan: <strong>{{ note.assignedTo }}</strong>
                    </div>
                    <div v-if="note.resolved" class="note-resolved-info mt-2 small text-success">
                      <i class="bi bi-check-circle"></i> {{ formatDate(note.resolvedAt) }} tarihinde çözüldü
                    </div>
                  </div>
                </li>
              </ul>

              <!-- Yeni Not Ekleme Formu -->
              <div class="add-note-form mt-4 pt-3 border-top">
                <h6>Yeni Not Ekle</h6>
                <div class="mb-3">
                  <textarea 
                    v-model="newNote.text" 
                    class="form-control" 
                    rows="3" 
                    placeholder="Not veya uyarı ekleyin..."
                  ></textarea>
                </div>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Öncelik</label>
                    <select v-model="newNote.priority" class="form-select">
                      <option value="normal">Normal</option>
                      <option value="warning">Uyarı</option>
                      <option value="critical">Kritik</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Atanan Kişi/Birim</label>
                    <select v-model="newNote.assignedTo" class="form-select">
                      <option value="">Seçiniz (Opsiyonel)</option>
                      <option value="Üretim">Üretim</option>
                      <option value="Planlama">Planlama</option>
                      <option value="Satın Alma">Satın Alma</option>
                      <option value="Kalite">Kalite</option>
                      <option value="Montaj">Montaj</option>
                    </select>
                  </div>
                </div>
                <div class="mt-3">
                  <button 
                    class="btn btn-primary"
                    @click="addNote"
                    :disabled="!newNote.text.trim() || noteLoading"
                  >
                    <span v-if="noteLoading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Not Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sağ kolon: AI analizi ve öneriler -->
        <div class="col-md-4">
          <!-- AI Analiz Kartı -->
          <div class="card mb-4">
            <div class="card-header bg-primary text-white">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  <i class="bi bi-robot me-2"></i> Yapay Zeka Analizi
                </h5>
                <button v-if="aiAnalysis" class="btn btn-sm btn-light" @click="performAIAnalysis">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
            <div class="card-body">
              <!-- Yükleniyor göstergesi -->
              <div v-if="isAnalyzing" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Analiz yapılıyor...</span>
                </div>
                <p class="mt-2 text-muted">AI analizi yapılıyor...</p>
              </div>
              
              <!-- Analiz yok ise -->
              <div v-else-if="!aiAnalysis" class="text-center py-4">
                <div class="ai-empty-state">
                  <i class="bi bi-robot display-4 text-muted"></i>
                  <p class="mt-3">Bu sipariş için henüz bir AI analizi yapılmamış.</p>
                  <button class="btn btn-primary mt-2" @click="performAIAnalysis">
                    <i class="bi bi-magic me-1"></i> Analiz Yap
                  </button>
                </div>
              </div>
              
              <!-- Analiz sonuçları -->
              <div v-else>
                <div class="ai-analysis-report">
                  <div class="analysis-timestamp small text-muted mb-3">
                    <i class="bi bi-clock me-1"></i> {{ formatDate(aiAnalysis.timestamp, true) }}
                  </div>
                  
                  <div class="analysis-content">
                    <p v-html="formatAnalysisText(aiAnalysis.analysis)"></p>
                  </div>
                  
                  <!-- AI Önerileri -->
                  <div v-if="aiSuggestions.length > 0" class="mt-4">
                    <h6>Öneriler</h6>
                    <div class="list-group mt-2">
                      <button 
                        v-for="(suggestion, index) in aiSuggestions" 
                        :key="index"
                        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        @click="handleSuggestion(suggestion.action)"
                      >
                        {{ suggestion.text }}
                        <i class="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Zaman Çizelgesi -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Zaman Çizelgesi</h5>
            </div>
            <div class="card-body p-0">
              <div class="timeline-container">
                <ul class="timeline-list">
                  <li v-for="event in timeline" :key="event.id" class="timeline-item">
                    <div class="timeline-marker" :class="getEventTypeClass(event.type)"></div>
                    <div class="timeline-content">
                      <span class="timeline-date small">{{ formatDate(event.timestamp) }}</span>
                      <h6 class="mb-1">{{ event.title }}</h6>
                      <p class="mb-0 small">{{ event.description }}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Müşteri Bilgileri -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Müşteri Bilgileri</h5>
            </div>
            <div class="card-body">
              <div v-if="order.customerInfo">
                <div class="mb-3">
                  <label class="form-label small text-muted">Firma Adı</label>
                  <p class="mb-0">{{ order.customerInfo.name }}</p>
                </div>
                <div class="mb-3">
                  <label class="form-label small text-muted">İlgili Kişi</label>
                  <p class="mb-0">{{ order.customerInfo.contactPerson }}</p>
                </div>
                <div class="mb-3">
                  <label class="form-label small text-muted">Telefon</label>
                  <p class="mb-0">{{ order.customerInfo.phone }}</p>
                </div>
                <div>
                  <label class="form-label small text-muted">E-posta</label>
                  <p class="mb-0">{{ order.customerInfo.email }}</p>
                </div>
              </div>
              <div v-else class="text-center py-2">
                <p class="text-muted mb-0">Müşteri bilgisi bulunamadı</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useOrderDetail } from './useOrderDetail';

export default {
  name: 'OrderDetail',
  
  setup() {
    const {
      order,
      isLoading,
      isAnalyzing,
      aiAnalysis,
      aiSuggestions,
      relatedMaterials,
      timeline,
      notes,
      newNote,
      noteLoading,
      productionSteps,
      productionData,
      orderId,
      orderNo,
      customerName,
      isDelayed,
      orderStatusClass,
      orderStatusText,
      hasCriticalNotes,
      hasWarningNotes,
      loadOrder,
      performAIAnalysis,
      addNote,
      resolveNote,
      updateOrderStatus,
      goBack
    } = useOrderDetail();

    // Tarih formatı
    const formatDate = (dateStr, includeTime = false) => {
      if (!dateStr) return '-';
      
      try {
        const date = new Date(dateStr);
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        
        if (includeTime) {
          options.hour = '2-digit';
          options.minute = '2-digit';
        }
        
        return new Intl.DateTimeFormat('tr-TR', options).format(date);
      } catch (error) {
        return dateStr;
      }
    };
    
    // İlerleme çubuğu sınıfı
    const getProgressBarClass = (progress) => {
      if (progress >= 100) return 'bg-success';
      if (progress >= 75) return 'bg-info';
      if (progress >= 50) return 'bg-primary';
      if (progress >= 25) return 'bg-warning';
      return 'bg-danger';
    };
    
    // Hücre durumu sınıfı
    const getCellStatusClass = (status) => {
      switch (status) {
        case 'planned': return 'bg-info';
        case 'in_progress': return 'bg-primary';
        case 'delayed': return 'bg-danger';
        case 'completed': return 'bg-success';
        default: return 'bg-secondary';
      }
    };
    
    // Hücre durumu metni
    const getCellStatusText = (status) => {
      switch (status) {
        case 'planned': return 'Planlandı';
        case 'in_progress': return 'Üretimde';
        case 'delayed': return 'Gecikmiş';
        case 'completed': return 'Tamamlandı';
        default: return 'Belirsiz';
      }
    };
    
    // Üretim adımı durumu sınıfı
    const getStepStatusClass = (status) => {
      switch (status) {
        case 'pending': return 'step-pending';
        case 'in-progress': return 'step-in-progress';
        case 'completed': return 'step-completed';
        case 'delayed': return 'step-delayed';
        case 'canceled': return 'step-canceled';
        default: return '';
      }
    };
    
    // Üretim adımı durumu ikonu
    const getStepStatusIcon = (status) => {
      switch (status) {
        case 'pending': return 'bi bi-clock';
        case 'in-progress': return 'bi bi-arrow-right-circle';
        case 'completed': return 'bi bi-check-circle';
        case 'delayed': return 'bi bi-exclamation-circle';
        case 'canceled': return 'bi bi-x-circle';
        default: return 'bi bi-circle';
      }
    };
    
    // Malzeme satır sınıfı
    const getMaterialRowClass = (material) => {
      if (material.status === 'missing') {
        return 'table-danger';
      } else if (material.status === 'critical') {
        return 'table-warning';
      } else if (material.status === 'ordered') {
        return 'table-info';
      }
      return '';
    };
    
    // Stok durumu sınıfı
    const getStockStatusClass = (material) => {
      switch (material.status) {
        case 'available': return 'bg-success';
        case 'partial': return 'bg-warning';
        case 'critical': return 'bg-warning';
        case 'missing': return 'bg-danger';
        case 'ordered': return 'bg-info';
        default: return 'bg-secondary';
      }
    };
    
    // Stok durumu metni
    const getStockStatusText = (material) => {
      switch (material.status) {
        case 'available': return 'Stokta Var';
        case 'partial': return `Kısmen Mevcut (${material.availableQuantity}/${material.quantity})`;
        case 'critical': return 'Kritik Seviye';
        case 'missing': return 'Stokta Yok';
        case 'ordered': return 'Sipariş Edildi';
        default: return 'Bilinmiyor';
      }
    };
    
    // Not önceliği sınıfı
    const getNotePriorityClass = (priority) => {
      switch (priority) {
        case 'normal': return 'bg-primary';
        case 'warning': return 'bg-warning';
        case 'critical': return 'bg-danger';
        default: return 'bg-secondary';
      }
    };
    
    // Not önceliği metni
    const getNotePriorityText = (priority) => {
      switch (priority) {
        case 'normal': return 'Normal';
        case 'warning': return 'Uyarı';
        case 'critical': return 'Kritik';
        default: return 'Bilinmiyor';
      }
    };
    
    // Olay tipi sınıfı
    const getEventTypeClass = (type) => {
      switch (type) {
        case 'created': return 'marker-created';
        case 'updated': return 'marker-updated';
        case 'status-change': return 'marker-status';
        case 'note': return 'marker-note';
        default: return '';
      }
    };
    
    // Analiz metni formatlama (URL'leri link yap, anahtar kelimeleri vurgula)
    const formatAnalysisText = (text) => {
      if (!text) return '';
      
      let formatted = text
        // URL'leri link yap
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        // Satır aralarını koru
        .replace(/\n/g, '<br>')
        // Sipariş numaralarını vurgula
        .replace(/#(\d{4}-\d{4})/g, '<strong class="text-primary">#$1</strong>');
      
      return formatted;
    };
    
    // AI önerisini işle
    const handleSuggestion = (action) => {
      switch (action) {
        case 'analyze-delay':
          // Gecikme analizi yapıldı bilgisini göster
          alert('Gecikme analizi yakında eklenecek');
          break;
        case 'notify-customer':
          // Müşteri bilgilendirme ekranını göster
          alert('Müşteri bilgilendirme özelliği yakında eklenecek');
          break;
        case 'review-issues':
          // Kritik sorunlara odaklan
          window.scrollTo({
            top: document.querySelector('.note-item:has(.priority-critical)').offsetTop,
            behavior: 'smooth'
          });
          break;
        case 'optimize-production':
          // Üretim optimizasyonu önerilerini göster
          alert('Üretim optimizasyonu önerileri yakında eklenecek');
          break;
        case 'review-materials':
          // Eksik malzemelere odaklan
          window.scrollTo({
            top: document.querySelector('.card-header:contains("Malzemeler")').offsetTop,
            behavior: 'smooth'
          });
          break;
        default:
          console.log('Bilinmeyen öneri eylemi:', action);
      }
    };
    
    return {
      order,
      isLoading,
      isAnalyzing,
      aiAnalysis,
      aiSuggestions,
      relatedMaterials,
      timeline,
      notes,
      newNote,
      noteLoading,
      productionSteps,
      productionData,
      orderId,
      orderNo,
      customerName,
      isDelayed,
      orderStatusClass,
      orderStatusText,
      hasCriticalNotes,
      hasWarningNotes,
      performAIAnalysis,
      addNote,
      resolveNote,
      updateOrderStatus,
      goBack,
      formatDate,
      getProgressBarClass,
      getCellStatusClass,
      getCellStatusText,
      getStepStatusClass,
      getStepStatusIcon,
      getMaterialRowClass,
      getStockStatusClass,
      getStockStatusText,
      getNotePriorityClass,
      getNotePriorityText,
      getEventTypeClass,
      formatAnalysisText,
      handleSuggestion
    };
  }
};
</script>

<style lang="scss" scoped>
.order-detail-page {
  .card {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    border: none;
    border-radius: 8px;
    
    .card-header {
      background-color: #fff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      padding: 15px 20px;
      font-weight: 600;
    }
  }
  
  // Üretim Adımları
  .production-timeline {
    padding: 10px 0;
    
    .production-step {
      display: flex;
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .step-status {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-right: 15px;
        
        .step-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #e9ecef;
          margin-bottom: 5px;
          z-index: 2;
          
          i {
            color: #fff;
          }
          
          &.step-pending {
            background-color: #adb5bd;
          }
          
          &.step-in-progress {
            background-color: #0d6efd;
          }
          
          &.step-completed {
            background-color: #198754;
          }
          
          &.step-delayed {
            background-color: #ffc107;
          }
          
          &.step-canceled {
            background-color: #dc3545;
          }
        }
        
        .step-line {
          width: 2px;
          background-color: #e9ecef;
          flex-grow: 1;
          z-index: 1;
        }
      }
      
      .step-content {
        flex: 1;
        padding-bottom: 15px;
      }
    }
  }
  
  // Not listesi
  .notes-list {
    margin-bottom: 0;
    
    .note-item {
      display: flex;
      padding: 15px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 15px;
      background-color: #fff;
      transition: background-color 0.2s;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      &.note-resolved {
        background-color: #f8f9fa;
        opacity: 0.8;
      }
      
      .note-priority-indicator {
        width: 4px;
        border-radius: 4px;
        margin-right: 15px;
        
        &.priority-normal {
          background-color: #0d6efd;
        }
        
        &.priority-warning {
          background-color: #ffc107;
        }
        
        &.priority-critical {
          background-color: #dc3545;
        }
      }
      
      .note-content {
        flex: 1;
      }
    }
  }
  
  // Zaman çizelgesi
  .timeline-container {
    padding: 15px 0;
    
    .timeline-list {
      list-style: none;
      padding: 0;
      margin: 0;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 15px;
        width: 2px;
        background-color: #e9ecef;
      }
      
      .timeline-item {
        position: relative;
        padding-left: 40px;
        margin-bottom: 15px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .timeline-marker {
          position: absolute;
          left: 10px;
          top: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #fff;
          background-color: #0d6efd;
          z-index: 1;
          
          &.marker-created {
            background-color: #198754;
          }
          
          &.marker-updated {
            background-color: #0d6efd;
          }
          
          &.marker-status {
            background-color: #6c757d;
          }
          
          &.marker-note {
            background-color: #ffc107;
          }
        }
        
        .timeline-content {
          padding: 0 0 15px;
          
          .timeline-date {
            color: #6c757d;
            display: block;
            margin-bottom: 5px;
          }
        }
      }
    }
  }
  
  // AI Analizi
  .ai-analysis-report {
    .analysis-content {
      p {
        margin-bottom: 0.75rem;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
  
  .ai-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }
  
  // Responsive düzenlemeler
  @media (max-width: 992px) {
    .timeline-container {
      .timeline-list {
        .timeline-item {
          padding-left: 30px;
          
          .timeline-marker {
            left: 5px;
          }
        }
      }
    }
  }
}
</style>