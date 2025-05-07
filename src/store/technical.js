/**
 * technical.js
 * Teknik doküman ve sorgulamalar için Pinia store
 */

import { defineStore } from 'pinia';
import { aiService } from '@/services/ai-service';

export const useTechnicalStore = defineStore('technical', {
  state: () => ({
    documents: [],
    isLoading: false,
    error: null,
    selectedDocument: null,
    isAIChatModalOpen: false,
    lastQuery: null,
    recentQueries: [],
    synonymsDB: {
      'akım': ['akım', 'current', 'amper', 'amperage'],
      'gerilim': ['gerilim', 'voltaj', 'voltage', 'volt'],
      'trafo': ['trafo', 'transformatör', 'transformer'],
      'hücre': ['hücre', 'cell', 'kompartıman', 'compartment', 'hucre'],
      'bara': ['bara', 'busbar', 'iletken çubuk', 'bus', 'barr'],
      'kesici': ['kesici', 'circuit breaker', 'cb', 'breaker', 'şalter'],
      'ayırıcı': ['ayırıcı', 'disconnector', 'isolator'],
      'montaj': ['montaj', 'assembly', 'installation', 'kurulum'],
      'sigorta': ['sigorta', 'fuse', 'protection'],
      'motor': ['motor', 'motor tahrik', 'motor drive'],
      'topraklama': ['topraklama', 'grounding', 'earthing', 'toprak']
    },
    documentWeights: {
      'title': 5,
      'description': 3,
      'category': 2,
      'content': 4,
      'exactMatch': 10,
      'synonymMatch': 3
    }
  }),

  getters: {
    getDocuments: (state) => state.documents,
    getSelectedDocument: (state) => state.selectedDocument,
    getIsLoading: (state) => state.isLoading,
    
    // Gelişmiş doküman arama algoritması
    getRelatedDocuments: (state) => (query) => {
      // Eğer daha önce tam eşleşen sorgu varsa onu kullan
      if (state.lastQuery && state.lastQuery.query === query && state.lastQuery.relatedDocs) {
        return state.lastQuery.relatedDocs;
      }
      
      // Arama metnini normalleştir
      const normalizedQuery = query.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s{2,}/g, " ");
      
      // Anahtar kelimeler ve eşanlamlıları için puanlama
      const keywordScores = {};
      Object.keys(state.synonymsDB).forEach(keyword => {
        state.synonymsDB[keyword].forEach(synonym => {
          if (normalizedQuery.includes(synonym)) {
            keywordScores[keyword] = (keywordScores[keyword] || 0) + 1;
          }
        });
      });
      
      // Her dokümana bir puan hesapla
      const scoredDocuments = state.documents.map(doc => {
        let score = 0;
        const normalizedName = doc.name.toLowerCase();
        const normalizedDesc = doc.description ? doc.description.toLowerCase() : '';
        const normalizedCategory = doc.category ? doc.category.toLowerCase() : '';
        
        // Başlık ve içerikte anahtar kelime eşleşmesi
        Object.keys(keywordScores).forEach(keyword => {
          if (normalizedName.includes(keyword)) score += state.documentWeights.title * keywordScores[keyword];
          if (normalizedDesc.includes(keyword)) score += state.documentWeights.description * keywordScores[keyword];
          if (normalizedCategory.includes(keyword)) score += state.documentWeights.category * keywordScores[keyword];
          
          // Eşanlamlılar için de kontrol
          state.synonymsDB[keyword].forEach(synonym => {
            if (synonym !== keyword) {
              if (normalizedName.includes(synonym)) {
                score += state.documentWeights.synonymMatch;
              }
              if (normalizedDesc.includes(synonym)) {
                score += state.documentWeights.synonymMatch * 0.6;
              }
            }
          });
        });
        
        // Tam eşleşme bonusu
        if (normalizedName.includes(normalizedQuery)) {
          score += state.documentWeights.exactMatch;
        }
        if (normalizedDesc.includes(normalizedQuery)) {
          score += state.documentWeights.exactMatch * 0.5;
        }
        
        // Hücre tiplerini özel olarak kontrol et
        const hucreTypes = ["cb", "lb", "bc", "fl", "rmu"];
        hucreTypes.forEach(type => {
          if (normalizedQuery.includes(`rm 36 ${type}`) && normalizedName.includes(`rm 36 ${type}`)) {
            score += state.documentWeights.exactMatch * 2;
          }
        });
        
        // Versiyon özelliklerine göre ek puanlar
        // Daha yeni dokümanları biraz daha yüksek puanla
        if (doc.version) {
          const versionNumber = parseFloat(doc.version.replace(/[^0-9.]/g, ''));
          if (!isNaN(versionNumber)) {
            score += versionNumber; // Versiyon numarası eklenir (ör. 2.1 için +2.1)
          }
        }
        
        // Doküman kategorisine göre puanlama
        const docType = doc.category ? doc.category.toLowerCase() : '';
        if (normalizedQuery.includes('prosedür') && docType === 'prosedür') score += 6;
        if (normalizedQuery.includes('kılavuz') && docType === 'kılavuz') score += 6;
        if (normalizedQuery.includes('şartname') && docType === 'şartname') score += 8;
        if (normalizedQuery.includes('teknik') && docType === 'teknik doküman') score += 5;
        
        // Sorgudan çıkarılabilen amaçlara göre puanlama
        if (normalizedQuery.includes('nasıl')) {
          if (docType === 'kılavuz' || docType === 'talimat') score += 7;
        }
        if (normalizedQuery.includes('nedir') || normalizedQuery.includes('özellikleri')) {
          if (docType === 'teknik doküman' || docType === 'şartname') score += 7;
        }
        
        // Zaman yakınlığına göre de puan ekle - daha yeni dökümanlar öncelikli olsun
        if (doc.uploadDate) {
          const docDate = new Date(doc.uploadDate);
          const currentDate = new Date();
          const daysDifference = Math.ceil((currentDate - docDate) / (1000 * 60 * 60 * 24));
          
          // 90 günden yeni olan dökümanlar için bonus (max +3)
          if (daysDifference < 90) {
            score += Math.max(0, 3 - (daysDifference / 30));
          }
        }
        
        return { doc, score };
      });
      
      // Puanları sırala ve sonuçları döndür
      const relatedDocs = scoredDocuments
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.doc);
      
      // Sonuç yoksa veya az ise, kategoriye göre genişlet
      if (relatedDocs.length < 2) {
        const possibleTypes = ['teknik doküman', 'şartname', 'kılavuz', 'prosedür', 'talimat'];
        for (const type of possibleTypes) {
          const typeMatches = state.documents.filter(doc => 
            doc.category && doc.category.toLowerCase() === type.toLowerCase()
          );
          
          for (const match of typeMatches) {
            if (!relatedDocs.find(d => d.id === match.id)) {
              relatedDocs.push(match);
              if (relatedDocs.length >= 5) break;
            }
          }
          
          if (relatedDocs.length >= 5) break;
        }
      }
      
      // En fazla 5 doküman döndür
      return relatedDocs.slice(0, 5);
    }
  },

  actions: {
    async fetchDocuments() {
      this.isLoading = true;
      try {
        // Burada API'den teknik dokümanların alınması simüle edildi
        // Gerçek uygulamada bir servis çağrısı yapılacak
        const documents = [
          { 
            id: 1, 
            name: 'RM 36 CB Teknik Şartnamesi', 
            category: 'şartname', 
            version: 'Rev.2.1',
            uploadDate: '2024-04-15',
            size: '2.3 MB',
            downloadUrl: '#',
            description: 'RM 36 CB hücresine ait teknik şartname dokümanı'
          },
          { 
            id: 2, 
            name: 'RM 36 LB Montaj Talimatı', 
            category: 'talimat', 
            version: 'Rev.1.3',
            uploadDate: '2024-04-10',
            size: '1.8 MB',
            downloadUrl: '#',
            description: 'RM 36 LB hücresi montaj talimatları'
          },
          { 
            id: 3, 
            name: 'Akım Trafosu Seçim Kılavuzu', 
            category: 'kılavuz', 
            version: 'Rev.1.3',
            uploadDate: '2024-04-01',
            size: '3.1 MB',
            downloadUrl: '#',
            description: 'Akım trafolarının seçimine ilişkin teknik bilgiler'
          },
          { 
            id: 4, 
            name: 'RM 36 Serisi Bara Montaj Kılavuzu', 
            category: 'kılavuz', 
            version: 'Rev.1.8',
            uploadDate: '2024-03-25',
            size: '4.2 MB',
            downloadUrl: '#',
            description: 'RM 36 serisi için bara montaj kılavuzu'
          },
          { 
            id: 5, 
            name: 'RM 36 Motor Teknik Özellikleri', 
            category: 'teknik doküman', 
            version: 'Rev.1.2',
            uploadDate: '2024-03-20',
            size: '1.4 MB',
            downloadUrl: '#',
            description: 'RM 36 serisi motorlu mekanizmaların teknik özellikleri'
          },
          {
            id: 6,
            name: 'RM 36 CB Test Prosedürü',
            category: 'prosedür',
            version: 'Rev.2.0',
            uploadDate: '2024-03-18',
            size: '2.8 MB',
            downloadUrl: '#',
            description: 'RM 36 CB hücresi test prosedürleri ve kontrol listesi'
          },
          {
            id: 7,
            name: 'Orta Gerilim Hücreler Genel Katalog',
            category: 'katalog',
            version: 'Rev.4.2',
            uploadDate: '2024-02-15',
            size: '8.5 MB',
            downloadUrl: '#',
            description: 'Tüm orta gerilim ürün ailesi için genel katalog'
          },
          {
            id: 8,
            name: 'RM 36 BC STEP Modeli Teknik Çizim',
            category: '3D model',
            version: 'Rev.1.5',
            uploadDate: '2024-02-10',
            size: '15.7 MB',
            downloadUrl: '#',
            description: 'RM 36 BC barınak için STEP formatında 3D teknik çizim'
          },
          {
            id: 9,
            name: 'Orta Gerilim Kesici Bakım Talimatı',
            category: 'talimat',
            version: 'Rev.3.0',
            uploadDate: '2024-01-20',
            size: '2.4 MB',
            downloadUrl: '#',
            description: 'CB tipi kesicilerin bakım ve kontrol talimatları'
          },
          {
            id: 10,
            name: 'OG Akım/Gerilim Trafoları Kataloğu',
            category: 'katalog',
            version: 'Rev.2.5',
            uploadDate: '2024-01-05',
            size: '5.8 MB',
            downloadUrl: '#',
            description: 'Kullanılabilecek tüm akım ve gerilim trafosu modellerinin karşılaştırmalı özellikleri'
          }
        ];

        this.documents = documents;
        return { success: true, data: documents };
      } catch (error) {
        this.error = 'Teknik dokümanlar yüklenirken bir hata oluştu';
        console.error('Teknik dokümanlar yüklenirken hata:', error);
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    selectDocument(document) {
      this.selectedDocument = document;
    },

    clearSelectedDocument() {
      this.selectedDocument = null;
    },

    // AI Chat Modal için durum yönetimi fonksiyonları
    setAIChatModalOpen(isOpen) {
      this.isAIChatModalOpen = isOpen;
    },

    // Teknik doküman ekle
    addDocument(document) {
      // Yeni bir ID oluştur
      const newId = this.documents.length > 0 ? Math.max(...this.documents.map(d => d.id)) + 1 : 1;
      
      const newDocument = {
        id: newId,
        uploadDate: new Date().toISOString().split('T')[0],
        ...document
      };
      
      this.documents.unshift(newDocument);
      return newDocument;
    },

    // Doküman içeriğini getir
    async getDocumentContent(documentId) {
      this.isLoading = true;
      try {
        // Gerçek bir API çağrısı yapmak yerine demo içerik döndürüyoruz
        const document = this.documents.find(d => d.id === documentId);
        if (!document) {
          throw new Error('Doküman bulunamadı');
        }
        
        // Demo içerik - gerçek uygulamada API'den gelecek
        let content = '';
        
        if (document.name.includes('Akım Trafosu')) {
          content = `# Akım Trafosu Teknik Bilgiler

Model: KAP-80/190-95
Anma Akımı: 200-400/5-5A
Hassasiyet Sınıfı: 5P20
Anma Gücü: 7,5/15VA
Çalışma Frekansı: 50Hz
İzolasyon Seviyesi: 36kV

Kullanım Alanları:
- RM 36 CB hücrelerinde koruma ve ölçme amacıyla kullanılır
- Orta gerilim dağıtım sistemlerinde akım ölçümü
- Diferansiyel koruma sistemleri

Montaj Talimatları:
- Bara bağlantı vidaları 35Nm tork ile sıkılmalıdır
- Terminaller 5Nm tork ile sıkılmalıdır
- Topraklama bağlantısı mutlaka yapılmalıdır`;
        } else if (document.name.includes('Test Prosedürü')) {
          content = `# RM 36 CB Test Prosedürü

Bu prosedür RM 36 CB hücrelerinin fabrika kabul testlerini tanımlar.

## Test Aşamaları

1. Görsel İnceleme
   - Boyalı yüzeylerin kontrolü
   - Etiketlerin kontrolü
   - Kapı mekanizmalarının kontrolü

2. Elektriksel Testler
   - İzolasyon direnci ölçümü
   - Yüksek gerilim testi (36kV)
   - Koruma röle fonksiyon testleri

3. Mekanik Operasyon Testleri
   - Kesicinin açma-kapama testi (minimum 5 operasyon)
   - Manuel ve motorlu operasyon testi
   - Topraklama switch'inin test edilmesi

4. Sensör ve Ölçüm Devreleri
   - Akım trafosu bağlantıları
   - Gerilim trafosu bağlantıları
   - Ölçüm devrelerinin kalibrasyonu

Test sonuçları tabloya kaydedilmeli ve kalite kontrol departmanı tarafından onaylanmalıdır.`;
        } else if (document.name.includes('Bara Montaj')) {
          content = `# RM 36 Serisi Bara Montaj Kılavuzu

## Bara Özellikleri

Tip: Elektrolitik Bakır (E-Cu / OF-Cu)
Standart kesitler: 40x5mm, 40x10mm, 60x10mm 
Uzunluklar: 582mm (Yan hücre bağlantısı için)
            432mm (Tek hücre için)
Stok kodları: 109367% (582mm)
              109363% (432mm)

## Montaj Talimatları

1. Tüm bara bağlantıları temizlenmeli ve oksit oluşumu önlenmelidir.
2. Bara bağlantıları için M12 cıvata kullanılmalı ve 65-70 Nm tork ile sıkılmalıdır.
3. Baralar arasında iletkenliği artırmak için özel iletken pasta kullanılmalıdır.
4. Bara bağlantılarına ısıl kamera ile sıcaklık kontrolü yapılmalıdır.

## Emniyet Uyarıları

- Montaj işlemi sırasında enerji olmadığından emin olunmalıdır.
- Bara bağlantıları için izole eldivenler kullanılmalıdır.
- Tüm bara uçları yalıtım kapaklarıyla kapatılmalıdır.`;
        } else if (document.name.includes('Motor Teknik')) {
          content = `# RM 36 Motor Teknik Özellikleri

## Motor Parametreleri

Nominal Gerilim: 24V DC (Standart)
Alternatif Gerilimler: 48V DC, 110V DC, 220V AC (Özel sipariş)
Güç: 
- Ayırıcı motorları: 60W
- Kesici motorları: 85W
- Topraklama switch motorları: 40W

Çalışma Süresi: 3-5 saniye (tam açma/kapama)
Motor Tipi: Redüktörlü DC motor
Koruma Sınıfı: IP54

## Bakım Bilgileri

- 10,000 operasyonda bir yağlama yapılmalıdır
- 50,000 operasyonda bir motor değişimi önerilir
- Her yıl çalışma performansı kontrol edilmelidir`;
        } else if (document.name.includes('Bakım Talimatı')) {
          content = `# Orta Gerilim Kesici Bakım Talimatı

## Periyodik Bakım Çizelgesi

| İşlem | Periyot | Gereken Ekipman |
|-------|---------|-----------------|
| Gözle muayene | 6 ay | - |
| Mekanik test | 1 yıl | Test cihazı |
| Yağlama | 2 yıl | Özel gres |
| Kapsamlı bakım | 4 yıl veya 10.000 operasyon | Bakım kiti |

## Bakım Prosedürü

1. Kesici enerji altında değilken yapılacak işlemler:
   - Mekanik parçaların kontrolü
   - Yağlama noktalarının kontrolü
   - Bağlantı elemanlarının kontrolü

2. Elektriksel testler:
   - Kontak direnci ölçümü
   - İzolasyon direnci ölçümü
   - Açma/kapama sürelerinin kontrolü

3. Yağlama işlemi:
   - Sadece önerilen gresler kullanılmalıdır
   - Fazla gres kontak kirliliğine neden olabilir
   - Yağlama sonrası mekanik testler tekrarlanmalıdır

## Güvenlik Uyarıları

- Bakım öncesi kilitleme-etiketleme prosedürü uygulanmalıdır
- Topraklama işlemi tamamlanmadan müdahale edilmemelidir
- Kapasitif gerilim göstergeleri kontrol edilmelidir`;
        } else if (document.name.includes('Genel Katalog')) {
          content = `# Orta Gerilim Hücreler Genel Katalog

## RM 36 Serisi Hücreler

| Model | Fonksiyon | Anma Akımı | Kısa Devre Dayanımı |
|-------|-----------|------------|---------------------|
| RM 36 CB | Kesicili Hücre | 630A-1250A | 20kA/1sn |
| RM 36 LB | Yük Ayırıcılı Hücre | 630A | 20kA/1sn |
| RM 36 FL | Sigortalı Hücre | 200A | 20kA/1sn |
| RM 36 BC | Bara Bağlantı Hücresi | 1250A | 20kA/1sn |
| RM 36 RMU | Ring Main Unit | 630A | 20kA/1sn |

## Teknik Özellikler

- Anma Gerilimi: 36kV
- Yalıtım Seviyesi: 70/170kV
- Nominal Frekans: 50Hz
- Koruma Sınıfı: IP3X (Opsiyonel: IP41)
- Standartlar: IEC 62271-200

## Opsiyonlar

- Motorlu tahrik: 24V, 48V, 110V DC, 220V AC
- Koruma rölesi: Mikroişlemcili, haberleşme özellikli
- Gerilim trafosu: Dahili veya harici montaj
- Akım trafosu: Toroidal veya epoksi reçine
- Topraklama bıçağı: Manuel veya motorlu

## Boyutlar

Standart hücre boyutları:
- Yükseklik: 2100 mm
- Genişlik: 750 mm
- Derinlik: 1500 mm

Özel boyutlar için lütfen satış ekibimizle iletişime geçiniz.`;
        } else if (document.name.includes('Trafoları Kataloğu')) {
          content = `# OG Akım/Gerilim Trafoları Kataloğu

## Akım Trafoları

| Model | Anma Akımı | Hassasiyet Sınıfı | Anma Gücü |
|-------|------------|-------------------|-----------|
| KAP-80/190-95 | 200-400/5-5A | 5P20 | 7,5/15VA |
| KAT-85/190-95 | 300-600/5-5A | 5P20 | 7,5/15VA |
| KAW-80/150-70 | 100-200/5A | 0.5 | 10VA |
| KAY-90/200-100 | 500-1000/5-5A | 5P20 | 15/30VA |

## Gerilim Trafoları

| Model | Anma Gerilimi | Hassasiyet Sınıfı | Anma Gücü |
|-------|--------------|-------------------|-----------|
| KDP-36 | 36kV/√3 / 100V/√3 | 0.5/3P | 50VA |
| KDG-36 | 36kV/√3 / 100V/√3 / 100V/3 | 0.5/3P | 50/50VA |
| KDK-36 | 36kV / 100V | 0.5 | 100VA |

## Kullanım Yerleri

- Akım trafoları genellikle kesici, yük ayırıcı veya bara üzerine monte edilir
- Gerilim trafoları kablo veya bara bağlantısı için uygundur
- Kombine ölçü trafoları hem akım hem gerilim ölçümü için kullanılır

## Bağlantı Şemaları

Akım trafolarında P1-P2 primer, S1-S2 sekonder bağlantılardır.
Gerilim trafolarında A-N primer, a-n sekonder bağlantılardır.

Bağlantı şeması için ilgili teknik çizime bakınız.`;
        } else if (document.name.includes('STEP Modeli')) {
          content = `# RM 36 BC STEP Modeli Teknik Çizim

## Model Bilgileri

- Format: STEP (ISO 10303)
- Yazılım Uyumluluğu: AutoCAD, SolidWorks, Inventor, CATIA
- Model Versiyonu: 1.5 (2024-02-10)
- Boyutlar: 750 x 1500 x 2100 mm (G x D x Y)
- Referans: RM36-BC-3D-REV15

## İçerik

Bu 3D model aşağıdaki bileşenleri içerir:
- Ana gövde ve kabin
- Bara sistemi (40x10mm Cu)
- İzolatörler
- Topraklama bağlantıları
- Kapı mekanizması

## Kullanım Kılavuzu

1. STEP dosyasını CAD yazılımınızda açın
2. Referans noktası olarak ön-alt-sol köşeyi kullanın
3. Bara bağlantıları için konum bilgileri çizimde belirtilmiştir
4. 3D model üzerinde ölçü kontrolü yapınız

## Notlar

- İmalat için 2D çizimler kullanılmalıdır
- Bu model genel tasarım amaçlıdır
- Özel uygulamalar için modifikasyonlar gerekebilir
- En güncel versiyon için doküman yönetimine başvurunuz`;
        } else {
          content = `# ${document.name} içeriği

Bu doküman için detaylı içerik bulunmamaktadır. Lütfen doküman yöneticisiyle iletişime geçiniz.`;
        }
        
        return { 
          success: true, 
          content,
          document
        };
        
      } catch (error) {
        this.error = 'Doküman içeriği yüklenirken bir hata oluştu';
        console.error('Doküman içeriği yüklenirken hata:', error);
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    // Döküman içerikleri arasında semantik arama
    async searchInDocumentContents(query) {
      this.isLoading = true;
      try {
        const results = [];
        
        // İlgili dokümanların içeriğini çek ve arama yap
        for (const doc of this.documents) {
          const contentResult = await this.getDocumentContent(doc.id);
          
          if (contentResult.success && contentResult.content) {
            // İçerikte arama yap
            const normalizedQuery = query.toLowerCase();
            const normalizedContent = contentResult.content.toLowerCase();
            
            if (normalizedContent.includes(normalizedQuery)) {
              // İçerikte eşleşme bulundu
              // Eşleşme yapılan paragrafı bul
              const paragraphs = contentResult.content.split('\n\n');
              const matchingParagraphs = paragraphs.filter(p => 
                p.toLowerCase().includes(normalizedQuery)
              );
              
              if (matchingParagraphs.length > 0) {
                results.push({
                  document: doc,
                  matchingContent: matchingParagraphs[0], // İlk eşleşen paragraf
                  score: (matchingParagraphs.length / paragraphs.length) + 1 // Eşleşme oranı + sabit bonus
                });
              }
            }
          }
        }
        
        // Sonuçları skora göre sırala
        return results.sort((a, b) => b.score - a.score);
      } catch (error) {
        console.error('Döküman içeriği araması hatası:', error);
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    // Teknik sorgulama
    async performTechnicalQuery(question) {
      this.isLoading = true;
      try {
        // Önce sorguyla ilgili dokümanları bul
        const relatedDocs = this.getRelatedDocuments(question);
        
        // AI servisi üzerinden sorgulama yap
        let answer = null;
        
        try {
          // İlişkili dokümanların içeriklerini getir
          const docPromises = relatedDocs.slice(0, 2).map(doc => 
            this.getDocumentContent(doc.id)
          );
          
          const docResults = await Promise.all(docPromises);
          
          // Geçerli içeriğe sahip dokümanlardan ilkini seç
          const validDocResult = docResults.find(result => result.success && result.content);
          
          // Eğer doküman varsa AI analizi yap
          if (validDocResult) {
            const document = {
              id: validDocResult.document.id,
              name: validDocResult.document.name,
              content: validDocResult.content
            };
            
            const aiResult = await aiService.analyzeDocument(document, question);
            
            if (aiResult && aiResult.success) {
              answer = {
                text: aiResult.text,
                reference: validDocResult.document.name + ' ' + validDocResult.document.version
              };
            }
          }
        } catch (aiError) {
          console.warn('AI analizi yapılamadı, demo cevap kullanılacak:', aiError);
        }
        
        // Eğer AI analizi başarısız olduysa demo cevap kullan
        if (!answer) {
          answer = this.getDemoAnswer(question);
        }
        
        // Son sorguyu kaydet
        this.lastQuery = {
          query: question,
          answer,
          relatedDocs,
          timestamp: new Date()
        };
        
        // Son sorguları güncelle
        if (this.recentQueries.length >= 5) {
          this.recentQueries.pop(); // En eski sorguyu sil
        }
        this.recentQueries.unshift({
          query: question,
          timestamp: new Date()
        });
        
        return { 
          success: true, 
          answer,
          relatedDocs
        };
        
      } catch (error) {
        this.error = 'Teknik sorgulama yapılırken bir hata oluştu';
        console.error('Teknik sorgulama hatası:', error);
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },
    
    // Demo cevaplar oluştur
    getDemoAnswer(question) {
      const lowerQuestion = question.toLowerCase();
      let answer = {
        text: 'Bu konuda bilgi bulunamadı.',
        reference: 'Genel Teknik Doküman'
      };
      
      if (lowerQuestion.includes('akım trafosu')) {
        answer = {
          text: 'RM 36 CB hücresinde genellikle 200-400/5-5A 5P20 7,5/15VA veya 300-600/5-5A 5P20 7,5/15VA özelliklerinde toroidal tip akım trafoları kullanılmaktadır. Canias kodları: 144866% (KAP-80/190-95) veya 142227% (KAT-85/190-95). Bu trafolar Orta Gerilim Hücrelerinde koruma ve ölçme amacıyla kullanılır.',
          reference: 'RM 36 CB Teknik Şartnamesi Rev.2.1'
        };
      } else if (lowerQuestion.includes('montaj')) {
        answer = {
          text: 'RM 36 LB hücresinin montajı için özel talimatlar bulunmaktadır. Mekanik montaj işlemleri için montaj talimatına göre işlem yapılmalıdır.',
          reference: 'RM 36 LB Montaj Talimatı Rev.1.3'
        };
      } else if (lowerQuestion.includes('bara')) {
        answer = {
          text: 'OG Hücrelerde kullanılan baralar genellikle elektrolitik bakırdır. RM 36 serisi için 582mm ve 432mm uzunluklarında 40x10mm kesitinde düz bakır baralar kullanılır. Stok kodları: 109367% (582mm) ve 109363% (432mm).',
          reference: 'RM 36 Serisi Bara Montaj Kılavuzu Rev.1.8'
        };
      } else if (lowerQuestion.includes('motor') || lowerQuestion.includes('ayırıcı')) {
        answer = {
          text: 'RM 36 serisi hücrelerde kesici ve ayırıcılarda 24VDC motorlar standart olarak kullanılmaktadır. Özel gereksinimler için 48VDC, 110VDC ve 220VAC motorlar da mevcuttur. Çalışma süresi 3-5 saniye arasındadır.',
          reference: 'RM 36 Motor Teknik Özellikleri Rev.1.2'
        };
      } else if (lowerQuestion.includes('rm 36') || lowerQuestion.includes('hücre')) {
        answer = {
          text: 'RM 36 serisi hücreler, 36kV orta gerilim için tasarlanmıştır. Ana bileşenleri: kesici/yük ayırıcı, akım trafosu, gerilim trafosu, koruma rölesi ve bara sisteminden oluşur. Temel hücre tipleri: CB (Kesicili), LB (Yük Ayırıcılı), FL (Sigortalı), RMU (Ring Main Unit).',
          reference: 'Orta Gerilim Hücreler Genel Katalog Rev.4.2'
        };
      } else if (lowerQuestion.includes('bakım') || lowerQuestion.includes('maintenance')) {
        answer = {
          text: 'Orta gerilim kesicilerin bakım periyodu: 6 ayda bir gözle muayene, yılda bir mekanik test, 2 yılda bir yağlama ve 4 yılda bir (veya 10.000 operasyonda bir) kapsamlı bakım yapılmalıdır. Bakım öncesi mutlaka kilitleme-etiketleme prosedürü uygulanmalı ve topraklama işlemi tamamlanmadır.',
          reference: 'Orta Gerilim Kesici Bakım Talimatı Rev.3.0'
        };
      }
      
      return answer;
    },
    
    // Eşanlamlı kelimelere yenilerini ekle
    addSynonym(keyword, newSynonym) {
      if (this.synonymsDB[keyword]) {
        if (!this.synonymsDB[keyword].includes(newSynonym)) {
          this.synonymsDB[keyword].push(newSynonym);
          return true;
        }
      } else {
        // Yeni anahtar kelime ekle
        this.synonymsDB[keyword] = [keyword, newSynonym];
        return true;
      }
      return false;
    }
  }
});