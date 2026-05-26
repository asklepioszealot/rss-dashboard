# RSS Dashboard

Haber kaynaklarını, canlı yayınları ve borsa verilerini tek pencerede bir araya getiren komuta merkezi uygulaması.

![RSS Dashboard ekran görüntüsü](docs/screenshot.png)

## ✨ Özellikler

### Yayın izleme

- 4 ile 25 arası YouTube kanalını aynı anda izleyin — 3×3, 4×4, 5×5 ve arası grid seçenekleri mevcuttur.
- m3u8/HLS stream desteği: YouTube'da yer almayan kanallar için doğrudan stream URL'i girebilirsiniz.
- Kanal sıralamasını ayarlar üzerinden sürükle-bırak ile düzenleyebilirsiniz.

### Haber akışı

- Site URL'i girerek otomatik RSS feed bulma
- Kaynak ekleme, silme ve sıralama — dilediğiniz akışı özelleştirin
- Başlıkta arama; `Esc` tuşuyla anında temizleme
- Her kaynak için ayrı son dakika işareti: yalnızca işaretlediğiniz kaynaklar üst şeritte akar

### Borsa şeridi

- Yahoo Finance üzerinden anlık fiyat ve günlük değişim
- 7 varsayılan sembol: USD/TRY, EUR/TRY, altın, BIST 100, S&P 500, Brent, BTC
- Sembol ekleme ve silme — parite, endeks, futures veya kripto ekleyebilirsiniz

### Sistem entegrasyonu

- Windows yerel bildirimleri: son dakika haberlerinde, hangi kaynakların bildirim göndereceğini seçin
- Sistem tepsisi ikonu ile arka planda çalışma
- Pencere kapatma davranışı: tepsiye in ya da tamamen kapat — tercihe göre ayarlanır
- Windows başlangıcında otomatik açılma (isteğe bağlı; gizli modda başlar)
- Uygulama içinden tek tıkla tamamen kapatma
- Otomatik güncelleme kontrolü: yeni sürüm çıktığında haberdar olun, doğrudan uygulamadan indirin

### Görsel

- Koyu tema, yüksek yoğunluklu bilgi yerleşimi

---

## 📦 Kurulum

1. [Son sürümü indirin](https://github.com/asklepioszealot/rss-dashboard/releases/latest) — `RSS Dashboard Setup X.Y.Z.exe` dosyasına çift tıklayın.
2. Windows SmartScreen "Bu uygulamayı tanımıyoruz" uyarısı verebilir. **Daha fazla bilgi → Yine de çalıştır** ile devam edin.
3. Kurulum sihirbazını izleyin (klasör seçimi, masaüstü kısayolu vb.).
4. Başlat menüsünden veya masaüstü kısayolundan açın.

---

## 🔧 Geliştirme

**Gereksinim:** Node.js 20+ ve npm

```bash
git clone https://github.com/asklepioszealot/rss-dashboard.git
cd rss-dashboard
npm install
```

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme modu — Vite + Electron, otomatik yeniden yükleme |
| `npm run dist` | Windows NSIS installer üretir (`release/` klasörüne) |

---

## 📄 Lisans

Bu yazılım Custom Source-Available License altında dağıtılır. Kişisel ve ticari olmayan kullanım için açıktır; ticari kullanım için yazardan yazılı izin gereklidir. Tam metin için [LICENSE](LICENSE) dosyasına bakınız.

---

## 👤 Yazar

**Ahmet Kara** (asklepioszealot)

- GitHub: [github.com/asklepioszealot](https://github.com/asklepioszealot)
- İletişim: ahmetkara.kysr.38@gmail.com

---

## English

A command center application that brings news sources, live streams, and stock data together in a single window.

![RSS Dashboard screenshot](docs/screenshot.png)

### ✨ Features

#### Stream watching

- Watch 4 to 25 YouTube channels simultaneously — grid options available: 3×3, 4×4, 5×5 and beyond.
- m3u8/HLS stream support: for channels not on YouTube, you can enter stream URLs directly.
- Manage channel order through drag-and-drop in settings.

#### News feed

- Automatic RSS feed discovery by entering a site URL
- Add, remove, and organize sources — customize your feeds as you like
- Search by title; instant clearing with the `Esc` key
- Per-source breaking news marker: only marked sources appear in the top ticker

#### Stock ticker

- Real-time prices and daily changes from Yahoo Finance
- 7 default symbols: USD/TRY, EUR/TRY, gold, BIST 100, S&P 500, Brent, BTC
- Add and remove symbols — you can include currency pairs, indices, futures, or crypto

#### System integration

- Windows native notifications: choose which sources send notifications for breaking news
- System tray icon for background operation
- Window close behavior: minimize to tray or fully close — configurable to your preference
- Automatic startup with Windows (optional; starts in hidden mode)
- One-click full application close from within the app
- Automatic update checking: be notified when a new version is available, download directly from the app

#### Visual

- Dark theme, high-density information layout

---

### 📦 Installation

1. [Download the latest version](https://github.com/asklepioszealot/rss-dashboard/releases/latest) — double-click `RSS Dashboard Setup X.Y.Z.exe`.
2. Windows SmartScreen may show "We don't recognize this app" warning. Click **More info → Run anyway** to proceed.
3. Follow the installation wizard (folder selection, desktop shortcut, etc.).
4. Open from the Start menu or desktop shortcut.

---

### 🔧 Development

**Requirements:** Node.js 20+ and npm

```bash
git clone https://github.com/asklepioszealot/rss-dashboard.git
cd rss-dashboard
npm install
```

| Command | Description |
|---|---|
| `npm run dev` | Development mode — Vite + Electron, auto-reload |
| `npm run dist` | Build Windows NSIS installer (outputs to `release/` folder) |

---

### 📄 License

This software is distributed under a Custom Source-Available License. It is open for personal, non-commercial use; commercial use requires written permission from the author. See the [LICENSE](LICENSE) file for the full text.

---

### 👤 Author

**Ahmet Kara** (asklepioszealot)

- GitHub: [github.com/asklepioszealot](https://github.com/asklepioszealot)
- Contact: ahmetkara.kysr.38@gmail.com
