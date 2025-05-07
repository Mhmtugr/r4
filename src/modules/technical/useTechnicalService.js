/**
 * useTechnicalService.js
 * Teknik doküman ve sorgulama işlemleri için servis fonksiyonları
 */

import { ref } from 'vue';
import { apiService } from '@/services/api-service'; // Düzeltildi: named export kullanıyor
import { aiService } from '@/services/ai-service';   // Düzeltildi: named export kullanıyor
import { useToast } from '@/composables/useToast';

export function useTechnicalService() {
  const { toast } = useToast();
  
  // Demo doküman verileri - gerçek uygulamada API'den gelecek
  const demoDocuments = [
    { id: 'doc1', name: 'RM 36 CB Teknik Çizim', revision: '2.1', date: '15.10.2024', author: 'Ahmet Yılmaz', department: 'Elektrik Tasarım', url: '#doc1' },
    { id: 'doc2', name: 'RM 36 LB Montaj Talimatı', revision: '1.3', date: '10.10.2024', author: 'Mehmet Demir', department: 'Mekanik Tasarım', url: '#doc2' },
    { id: 'doc3', name: 'RM 36 FL Test Prosedürü', revision: '3.0', date: '05.10.2024', author: 'Ayşe Kaya', department: 'Test Birimi', url: '#doc3' },
    { id: 'doc4', name: 'RMU Kablaj Şeması', revision: '1.5', date: '01.10.2024', author: 'Fatma Şahin', department: 'Kablaj Birimi', url: '#doc4' },
    { id: 'doc5', name: 'Genel Montaj Akış Şeması', revision: '1.0', date: '25.09.2024', author: 'Ali Veli', department: 'Üretim', url: '#doc5' }
  ];
  
  /**
   * Tüm teknik dokümanları getir
   * @returns {Promise<Array>} Doküman listesi
   */
  const getDocuments = async () => {
    try {
      // Gerçek uygulamada API çağrısı yapılacak
      // return await apiService.get('/technical/documents');
      
      // Demo için gecikme ekleyelim
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...demoDocuments];
    } catch (error) {
      console.error('Doküman yüklenirken hata:', error);
      throw new Error('Dokümanlar yüklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  /**
   * Yeni doküman yükle
   * @param {Object} document Yüklenecek doküman bilgileri
   * @returns {Promise<Object>} Yüklenen doküman
   */
  const uploadDocument = async (document) => {
    try {
      // Gerçek uygulamada API çağrısı yapılacak
      // const formData = new FormData();
      // formData.append('name', document.name);
      // formData.append('revision', document.revision);
      // formData.append('department', document.department);
      // formData.append('file', document.file);
      // return await apiService.post('/technical/documents', formData);
      
      // Demo için gecikme ekleyelim
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Başarılı olduğunu varsayalım
      return {
        id: `doc${Date.now()}`,
        name: document.name,
        revision: document.revision,
        department: document.department,
        date: new Date().toLocaleDateString('tr-TR'),
        author: 'Mevcut Kullanıcı',
        url: '#new-doc'
      };
    } catch (error) {
      console.error('Doküman yüklenirken hata:', error);
      throw new Error('Doküman yüklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };
  
  /**
   * Teknik sorgu gönder
   * @param {string} query Teknik soru
   * @returns {Promise<Object>} AI yanıtı
   */
  const submitQuery = async (query) => {
    try {
      // Gerçek uygulamada AI servisi çağrılacak
      // return await aiService.getTechnicalAnswer(query);
      
      // Demo için gecikme ve örnek veri ekleyelim
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo yanıtlar
      const lowerQuery = query.toLowerCase();
      let response = {
        text: "Bu sorgu için demo cevap üretilemedi.",
        reference: "RM 36 Serisi Genel Teknik Şartname Rev.3.0",
        relatedDocIds: []
      };
      
      if (lowerQuery.includes('akım trafosu')) {
        response = {
          text: "RM 36 CB hücresinde genellikle 200-400/5-5A 5P20 7,5/15VA veya 300-600/5-5A 5P20 7,5/15VA özelliklerinde toroidal tip akım trafoları kullanılmaktadır. Canias kodları: 144866% (KAP-80/190-95) veya 142227% (KAT-85/190-95).",
          reference: "RM 36 CB Teknik Şartnamesi Rev.2.1",
          relatedDocIds: ['doc1', 'doc4']
        };
      } else if (lowerQuery.includes('montaj')) {
        response = {
          text: "RM 36 LB hücresinin montajı için özel talimatlar bulunmaktadır. Mekanik montaj işlemleri için montaj talimatına göre işlem yapılmalıdır.",
          reference: "RM 36 LB Montaj Talimatı Rev.1.3",
          relatedDocIds: ['doc2']
        };
      } else if (lowerQuery.includes('bara')) {
        response = {
          text: "OG Hücrelerde kullanılan baralar genellikle elektrolitik bakırdır. RM 36 serisi için 582mm ve 432mm uzunluklarında 40x10mm kesitinde düz bakır baralar kullanılır. Stok kodları: 109367% (582mm) ve 109363% (432mm).",
          reference: "RM 36 Serisi Bara Montaj Kılavuzu Rev.1.8",
          relatedDocIds: []
        };
      } else if (lowerQuery.includes('motor') || lowerQuery.includes('ayırıcı')) {
        response = {
          text: "RM 36 serisi hücrelerde kesici ve ayırıcılarda 24VDC motorlar standart olarak kullanılmaktadır. Motor gücü ayırıcılar için 60W, kesiciler için 85W değerindedir. Çalışma süresi 3-5 saniye arasındadır.",
          reference: "RM 36 Motor Teknik Özellikleri Rev.1.2",
          relatedDocIds: []
        };
      }
      
      return response;
    } catch (error) {
      console.error('Teknik sorgu hatası:', error);
      throw new Error('Teknik sorgu yapılamadı: ' + (error.message || 'Bilinmeyen hata'));
    }
  };
  
  // Dışa aktarılacak fonksiyonlar
  return {
    getDocuments,
    uploadDocument,
    submitQuery
  };
}