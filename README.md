# Mehmet Endüstriyel Takip Sistemi

## Genel Bakış
Mehmet Endüstriyel Takip (METS), endüstriyel üretim ve sipariş takibi için geliştirilmiş web tabanlı bir ERP uygulamasıdır. Sistem, malzeme stoku, sipariş durumu, üretim planlaması gibi temel ERP işlevlerini sağlar ve entegre chatbot ile kullanıcı sorularına yanıt verir.

## Özellikler
- 📊 Sipariş ve stok yönetimi
- 🤖 AI destekli chatbot asistanı
- 📱 Responsive tasarım
- 💾 Yerel veri önbelleği
- 🔄 Firebase entegrasyonu
- 📈 Üretim planlaması ve takibi

## Başlangıç

### Gereksinimler
- Web tarayıcısı (Chrome, Firefox, Edge önerilir)
- İnternet bağlantısı (yerel test için opsiyonel)

### Kurulum ve Çalıştırma

#### 1. Yerel Sunucu Kurulumu
Uygulamayı çalıştırmak için basit bir HTTP sunucusuna ihtiyacınız var. Aşağıdaki seçeneklerden birini kullanabilirsiniz:

**Visual Studio Code ile Live Server:**
1. Visual Studio Code'u yükleyin
2. Live Server eklentisini yükleyin
3. Projeyi VSCode'da açın
4. Sağ alt köşedeki "Go Live" butonuna tıklayın

**Python ile (Python yüklüyse):**
1. Komut isteminde proje klasörüne gidin
2. Şu komutu çalıştırın: `python -m http.server 8080`
3. Tarayıcınızda `http://localhost:8080` adresine gidin

**Node.js ile (Node.js yüklüyse):**
1. Komut isteminde proje klasörüne gidin
2. Şu komutu çalıştırın: `npx serve`
3. Tarayıcınızda belirtilen adresi açın

#### 2. Firebase Yapılandırması (Opsiyonel)
Uygulamayı tam fonksiyonel kullanmak için Firebase hesabı oluşturup, yapılandırmanız gerekebilir:

1. [Firebase Console](https://console.firebase.google.com/) adresinden yeni bir proje oluşturun
2. Web uygulaması ekleyin
3. Verilen yapılandırma bilgilerini `config/app-config.js` dosyasındaki Firebase bölümüne ekleyin

Firebase olmadan da uygulama demo verileriyle çalışacaktır.

## Test

Sistem testleri çalıştırmak için:
1. Uygulamayı bir tarayıcıda açın
2. Tarayıcı konsolunu açın (F12 tuşu)
3. Konsola `runAllTests()` yazıp Enter tuşuna basın

## Sorun Giderme

**Uygulama yüklenmiyor:**
- Tüm JavaScript dosyalarının doğru sırada yüklendiğinden emin olun
- Tarayıcı konsolunda hata mesajları olup olmadığını kontrol edin
- Tarayıcı önbelleğini temizleyin ve sayfayı yenileyin

**Chatbot çalışmıyor:**
- EventBus modülünün doğru yüklenip yüklenmediğini kontrol edin
- Tarayıcı konsolunda API bağlantı hatası olup olmadığını kontrol edin

**Veriler görüntülenmiyor:**
- Demo modunun etkin olup olmadığını kontrol edin
- Firebase yapılandırmasını kontrol edin (kullanılıyorsa)
- Tarayıcıda LocalStorage'ın etkin olduğundan emin olun

## Dağıtım (Deployment)

Uygulamanızı internet üzerinden erişilebilir hale getirmek için:

**Netlify ile (Ücretsiz):**
1. [Netlify](https://www.netlify.com/) hesabı oluşturun
2. Yeni site ekleyin ve kaynak kodunuzu yükleyin
3. Otomatik olarak dağıtılacaktır

**GitHub Pages ile (Ücretsiz):**
1. GitHub'a kodunuzu yükleyin
2. Repository ayarlarından GitHub Pages'i etkinleştirin
3. Ana branch'i seçin ve kaydedin

**Firebase Hosting ile (Ücretsiz/Ücretli):**
1. Firebase CLI yükleyin: `npm install -g firebase-tools`
2. Giriş yapın: `firebase login`
3. Başlatın: `firebase init hosting`
4. Dağıtın: `firebase deploy`
