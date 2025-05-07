/**
 * Logger Modülü
 * Uygulama genelinde tutarlı log kaydı sağlar.
 * Modül bazlı loglama, seviyelendirme, konsol çıktısı,
 * hafızada tutma ve harici servislere gönderme yetenekleri sunar.
 */

import appConfig from '@/config'; // Merkezi yapılandırma

// Loglama seviyeleri (Numeric)
const LogLevelNumbers = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4 // Loglamayı tamamen kapatmak için
};

// String seviyeleri numeric değerlere çevirme
const getLevelNumber = (levelName) => {
  const upperLevel = String(levelName).toUpperCase();
  return LogLevelNumbers[upperLevel] ?? LogLevelNumbers.INFO; // Varsayılan INFO
};

// Merkezi log deposu (yapılandırılırsa kullanılır)
const logEntries = [];

// Logger yapılandırması (varsayılanlar)
let currentConfig = {
  level: import.meta.env.VITE_LOG_LEVEL || appConfig.log?.level || (import.meta.env.PROD ? 'WARN' : 'DEBUG'),
  enableConsole: appConfig.log?.enableConsole ?? true,
  enableMemory: appConfig.log?.enableMemory ?? !import.meta.env.PROD, // Geliştirmede hafızada tut
  maxMemoryEntries: appConfig.log?.maxMemoryEntries || 500,
  enableRemote: appConfig.log?.remote?.enabled || false,
  remoteUrl: appConfig.log?.remote?.url || null,
  remoteLevel: appConfig.log?.remote?.level || 'WARN' // Uzak sunucuya sadece WARN ve üstünü gönder
};

let currentLogLevelNumber = getLevelNumber(currentConfig.level);
let remoteLogLevelNumber = getLevelNumber(currentConfig.remoteLevel);

/**
 * Logger sınıfı
 * Her modül/bağlam için ayrı bir logger instance'ı oluşturulabilir.
 */
class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _log(level, message, ...args) {
    const levelNumber = getLevelNumber(level);
    
    // Genel log seviyesi kontrolü
    if (levelNumber < currentLogLevelNumber) return;

    const timestamp = new Date();
    const logEntry = {
      timestamp: timestamp.toISOString(),
      level: level.toUpperCase(),
      context: this.context,
      message,
      // args'ı JSON'a çevrilebilir hale getir (hataları veya DOM elemanlarını işle)
      data: args.map(arg => {
        if (arg instanceof Error) {
            // Hata nesnelerini daha okunabilir hale getir
            return { 
                name: arg.name, 
                message: arg.message, 
                stack: arg.stack?.split('\n').map(s => s.trim()) // Stack trace'i dizi yap
            };
        }
        // Diğer kompleks objeler için JSON.stringify deneyebiliriz ama dikkatli olmalı
        try {
             // Çok büyük veya döngüsel referans içeren objeler sorun yaratabilir
            // Belki sadece basit tipleri veya belirli bir derinliğe kadar objeleri loglamak daha güvenli
            if (typeof arg === 'object' && arg !== null) {
                // Basit bir derinlik kontrolü veya stringify replacer eklenebilir
            }
             return arg; // Şimdilik olduğu gibi bırakalım
        } catch (e) {
            return `[Unserializable data: ${e.message}]`;
        }
      })
    };

    // Konsola yazdırma (yapılandırıldıysa)
    if (currentConfig.enableConsole) {
      const consoleArgs = [
        `%c[${logEntry.timestamp}] %c[${logEntry.level}] %c[${logEntry.context}]`, 
        'color: gray;', 
        `color: ${this._getLevelColor(level)}; font-weight: bold;`, 
        'color: blue;', 
        message, 
        ...args
      ];
      switch (level) {
        case 'debug': console.debug(...consoleArgs); break;
        case 'info': console.info(...consoleArgs); break;
        case 'warn': console.warn(...consoleArgs); break;
        case 'error': console.error(...consoleArgs); break;
        default: console.log(...consoleArgs);
      }
    }

    // Hafızaya kaydetme (yapılandırıldıysa)
    if (currentConfig.enableMemory) {
      logEntries.push(logEntry);
      // Maksimum boyutu aşarsa eskisini sil
      if (logEntries.length > currentConfig.maxMemoryEntries) {
        logEntries.shift(); // En eski logu çıkar
      }
    }

    // Uzak sunucuya gönderme (yapılandırıldıysa ve seviye uygunsa)
    if (currentConfig.enableRemote && currentConfig.remoteUrl && levelNumber >= remoteLogLevelNumber) {
      this._sendToRemote(logEntry);
    }
  }

  debug(message, ...args) { this._log('debug', message, ...args); }
  info(message, ...args) { this._log('info', message, ...args); }
  warn(message, ...args) { this._log('warn', message, ...args); }
  error(message, ...args) { this._log('error', message, ...args); }

  _getLevelColor(level) {
    switch (level) {
      case 'debug': return '#909090';
      case 'info': return '#20a0ff';
      case 'warn': return '#ff9900';
      case 'error': return '#ff3333';
      default: return '#333333';
    }
  }

  _sendToRemote(logEntry) {
    // fetch kullanarak basit bir gönderim (gerçek senaryoda daha sağlam bir yapı gerekir)
    fetch(currentConfig.remoteUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(error => {
      // Uzak loglama hatasını sadece konsola yazdır, uygulamanın akışını bozma
      console.error('[Logger] Uzak loglama sistemine gönderim hatası:', error);
    });
  }
}

// Varsayılan logger instance'ı (App context'i ile)
const defaultLogger = new Logger('App');

// Log yönetim fonksiyonları (hafıza logları için)
function getMemoryLogs() {
  return [...logEntries]; // Kopyasını döndür
}

function clearMemoryLogs() {
  logEntries.length = 0;
}

function searchMemoryLogs(searchTerm) {
    const term = String(searchTerm).toLowerCase();
    if (!term) return [];
    return logEntries.filter(log => {
        return log.message.toLowerCase().includes(term) || 
               (log.context && log.context.toLowerCase().includes(term)) ||
               (log.data && JSON.stringify(log.data).toLowerCase().includes(term));
    });
}

// Yapılandırmayı güncelleme fonksiyonu
function updateLogConfig(newConfig) {
  currentConfig = { ...currentConfig, ...newConfig };
  currentLogLevelNumber = getLevelNumber(currentConfig.level);
  remoteLogLevelNumber = getLevelNumber(currentConfig.remoteLevel);
  // logger.info('Logger yapılandırması güncellendi:', currentConfig); // Güncellenen config'i logla
}

// Dışa aktarılacak arayüz
export {
  Logger,         // Yeni instance oluşturmak için sınıf
  defaultLogger,  // Varsayılan (App) logger instance'ı
  LogLevelNumbers,// Log seviyeleri (sayısal)
  getMemoryLogs,  // Hafızadaki logları al
  clearMemoryLogs,// Hafızadaki logları temizle
  searchMemoryLogs,// Hafızadaki logları ara
  updateLogConfig // Çalışma zamanında yapılandırmayı güncelle
};

// Yaygın kullanım için varsayılan logger'ı da export et
export default defaultLogger;

// Add named export alias for logger
export const logger = defaultLogger;