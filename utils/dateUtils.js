/**
 * Tarih formatlama yardımcı fonksiyonları
 */

/**
 * Tarihi belirtilen formatta formatlar
 * @param {Date|string|number|object} date - Formatlanacak tarih
 * @param {string} format - Tarih formatı (örn: DD.MM.YYYY)
 * @returns {string} - Formatlanmış tarih
 */
export function formatDate(date, format = 'DD.MM.YYYY') {
    if (!date) return '';
    
    // Tarih nesnesi değilse dönüştür
    if (!(date instanceof Date)) {
        // Firestore Timestamp kontrolü
        if (date && typeof date.toDate === 'function') {
            date = date.toDate();
        } else if (typeof date === 'string' || typeof date === 'number') {
            date = new Date(date);
        } else {
            return '';
        }
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let result = format;
    result = result.replace('DD', day);
    result = result.replace('MM', month);
    result = result.replace('YYYY', year);
    
    return result;
}

/**
 * İki tarih arasındaki farkı gün olarak hesaplar
 * @param {Date} startDate - Başlangıç tarihi
 * @param {Date} endDate - Bitiş tarihi
 * @returns {number} - Gün farkı
 */
export function daysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}