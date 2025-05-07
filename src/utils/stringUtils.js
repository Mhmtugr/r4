/**
 * String ve ID ile ilgili yardımcı fonksiyonlar
 */

/**
 * Basit bir sipariş ID'si oluşturur (ornekindex.html'den taşındı)
 * Örnek: #2505-42
 * @returns {string} - Oluşturulan sipariş ID'si
 */
export function generateOrderId() {
    const date = new Date();
    const year = date.getFullYear().toString().substring(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `#${year}${month}-${randomNum}`;
}
