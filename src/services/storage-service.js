/**
 * Tarayıcı Depolama Servisi (LocalStorage Wrapper)
 */
class StorageService {
  constructor(storage = localStorage) {
    // Varsayılan olarak localStorage kullan, test için veya sessionStorage
    // gerekiyorsa dışarıdan farklı bir storage mekanizması verilebilir.
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
      console.error('Geçersiz depolama mekanizması sağlandı, localStorage kullanılamıyor.');
      // Depolama olmadan devam etmeyi engellemek için bir fallback veya hata fırlatma eklenebilir
      // Şimdilik basit bir obje ile devam edelim ki uygulama çökmesin
      this.storage = {
        _data: {},
        getItem: (key) => this._data[key] || null,
        setItem: (key, value) => { this._data[key] = String(value); },
        removeItem: (key) => { delete this._data[key]; },
        clear: () => { this._data = {}; }
      };
    } else {
       this.storage = storage;
    }
  }

  /**
   * Verilen anahtar ile değeri depolamaya kaydeder.
   * @param {string} key - Depolama anahtarı
   * @param {*} value - Depolanacak değer (JSON'a çevrilebilir olmalı)
   * @returns {boolean} - İşlem başarılı ise true, değilse false
   */
  set(key, value) {
    if (typeof key !== 'string' || key.trim() === '') {
      console.error('Geçersiz anahtar sağlandı.');
      return false;
    }
    try {
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error(`Veri kaydedilirken hata (Anahtar: ${key}):`, error);
      return false;
    }
  }

  /**
   * Verilen anahtara karşılık gelen değeri depolamadan alır.
   * @param {string} key - Depolama anahtarı
   * @returns {*} - Depolanan değer veya null
   */
  get(key) {
     if (typeof key !== 'string' || key.trim() === '') {
       console.error('Geçersiz anahtar sağlandı.');
       return null;
     }
    try {
      const serializedValue = this.storage.getItem(key);
      return serializedValue ? JSON.parse(serializedValue) : null;
    } catch (error) {
      console.error(`Veri okunurken hata (Anahtar: ${key}):`, error);
      // Hata durumunda anahtarı temizlemek düşünülebilir
      // this.remove(key);
      return null;
    }
  }

  /**
   * Verilen anahtara karşılık gelen değeri depolamadan kaldırır.
   * @param {string} key - Depolama anahtarı
   * @returns {boolean} - İşlem başarılı ise true, değilse false
   */
  remove(key) {
    if (typeof key !== 'string' || key.trim() === '') {
      console.error('Geçersiz anahtar sağlandı.');
      return false;
    }
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Veri silinirken hata (Anahtar: ${key}):`, error);
      return false;
    }
  }

  /**
   * Depolamadaki tüm verileri temizler.
   * @returns {boolean} - İşlem başarılı ise true, değilse false
   */
  clear() {
    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.error('Depolama temizlenirken hata:', error);
      return false;
    }
  }
}

// Singleton instance oluştur ve export et
export const storageService = new StorageService();

// İhtiyaç halinde sessionStorage için ayrı bir instance oluşturulabilir
// export const sessionService = new StorageService(sessionStorage); 