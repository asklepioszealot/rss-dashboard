# RSS Dashboard — Kaldığımız Yer

Yayıncı tarzı haber komuta merkezi: solda multiTV, sağda RSS, üstte son dakika şeridi, altta borsa ticker'ı.

## Durum: v1.1 Electron sarması YAZILDI ✅

Electron + in-process Express + tray + autostart eklendi. installer build (5. adım) henüz yok.

## Çalıştırma

### Electron (masaüstü uygulaması)

```bash
# Kökten — bağımlılıklar tüm alt projelere kurulur (postinstall)
cd "D:/Git Projelerim/rss-dashboard"
npm install

# Dev: Vite (5173) + Electron paralel
npm run dev

# Production: Vite build + Electron, in-process Express'ten serve eder
npm start
```

### Eski standalone (sadece backend, tarayıcı için)

```bash
cd server && npm run dev       # http://localhost:3001
cd client && npm run dev       # http://localhost:5173 (proxy → 3737, Electron çalışıyorsa)
```

Not: Vite proxy default `http://localhost:3737`'ye gider (Electron Express'i). Tarayıcı modunda 3001 kullanmak istersen `VITE_API_TARGET=http://localhost:3001 npm run dev --prefix client`.

## Onaylanmış Kararlar

- **Stack:** Node + Express (3001) + React + Vite (5173)
- **Tema:** Koyu, yoğun yerleşim — saf CSS (Tailwind yok)
- **v1 panelleri:** MultiTV (3x3) · RSS feed (sağ) · Breaking marquee (üst) · Borsa ticker (alt)
- **Cache:** node-cache · RSS 60sn · borsa 30sn
- **Ayarlar:** localStorage (`rss-dashboard-settings`)
- **YouTube:** iframe `embed/live_stream?channel=<ID>` · ID'ler `channels.json`'da
- **Borsa:** Yahoo Finance public chart endpoint

## Bilinen Riskler / İlk Test Notları

1. **YouTube channel ID'leri tahmindir** — canlı yayını olmayan kanalda boş iframe çıkar. `channels.json`'da düzeltilebilir.
2. **RSS URL'leri zaman zaman değişir** — bozuk feed konsola hata yazar, diğerleri çalışmaya devam eder.
3. **Yahoo Finance** rate limit'e takılırsa cache TTL'yi artır (`server/routes/finance.js`).
4. **YouTube embed reddederse** (bazı kanallar embed izni vermez), o slot boş kalır.

## v1 Dışı (sonraki iterasyonlar)

### v1.1 — Masaüstü uygulaması
1. ✅ Electron sarması + in-process Express (sabit port 3737)
2. ✅ Tray ikonu + arka planda çalışma (X = tepsiye iner, sağ tık menü)
3. ✅ Windows autostart (tray menüsünden toggle, `--hidden` ile sessiz açılış)
4. ✅ Native bildirim (son dakika kaynaklarından yeni item tespit → Notification)
5. ✅ electron-builder + NSIS .exe installer config (`npm run dist` ile build)

### v1.2 — Bug fixes & UX (kullanıcı geri bildirimleri)
- ✅ YouTube `/live/VIDEOID` URL formatı parse edilir
- ✅ Marquee + topbar overlap düzeltildi (track wrap div)
- ✅ Topbar/marquee yer değiştirdi
- ✅ Arama kutusu Haberler header'ına taşındı, placeholder "Haberlerde ara…"
- ✅ Kaynak filtre mantığı düzeltildi (null=hepsi, []=hiçbiri), "Hepsi/Hiçbiri" hızlı butonları
- ✅ Arama input'unda Esc ile temizleme + blur
- ✅ Marquee item tıklayınca haber linki açılır, hover'da animasyon durur
- ✅ Logo: turuncu kare üzerine RSS sembolü (icon.png 256x256 + tray.png 32x32)
- ✅ **v0.1.1** — Settings → Sürüm: kurulu sürüm + GitHub Releases API ile güncelleme kontrolü + indir linki
- ✅ GitHub'a push edildi: <https://github.com/asklepioszealot/rss-dashboard>
- ✅ **v0.1.2 — Uygulama kontrolü:** Settings'e "🚪 Uygulamayı tamamen kapat" butonu (tray'den ayrı, UI'dan da çıkış mümkün) + kaynak bazlı bildirim filtresi (RSS Kaynakları satırlarında 🔔 toggle, `null`=hepsi semantiği `selectedSources` ile aynı). Main process polling artık IPC ile push'lanan listeyi kullanır; default fallback `BREAKING_SOURCES` korunur.
- ✅ **v0.1.3 — m3u8 / HLS desteği:** `hls.js` ile `<video>` player (CNN Türk gibi YouTube embed reddeden kanallar için). `parseChannelSource` zaten m3u8 tanıyordu — yeni `HlsPlayer.jsx` component'i, `ChannelTile.jsx`'te `parsed.type==='hls'` branch'i, Safari native HLS + Chromium hls.js fallback, hata olunca "⚠ Yayın yüklenemedi" tile. Default `channels.json` dokunulmadı — kullanıcı UI'dan m3u8 URL girer.
- ⏳ YouTube embed reddeden kanallar (CNN Türk vb. — Ciner Holding telif) için alternatif kaynak: m3u8 stream URL, yt-dlp ile direkt video URL extraction (v1.6 ile birlikte)

### v1.2.x — Bekleyen küçük işler (v1.3 öncesi park)

**Settings UX (kullanıcı şikayeti):**
- ⏳ Header hiyerarşi tutarsız — `📺 Multi TV · Ayarlar` h2 kocaman, alt section başlıkları (RSS Kaynakları, Sürüm) küçük h3. Tutarlı typography lazım. Belki: accordion/tabs ile bölümleme (Multi TV / Haberler / Borsa / Sürüm sekmeleri)
- ⏳ VersionTag altına credit: **"by Ahmet Kara · asklepioszealot@proton.me"**

**Ticker / Borsa:**
- ⏳ Animasyon hızı arttırılmalı (şu an 80s, ~50-60s daha iyi)
- ⏳ Borsa pariteleri UI'dan eklenebilmeli — backend zaten `?symbols=...` query'sini kabul ediyor, sadece Settings'te form gerek (kanal yöneticisi paterni)
- ⏳ Borsa/döviz için RSS kaynağı keşfi (varsa entegre et)

**RSS Kaynak Yönetimi (v1.5'ten öne çekildi, kullanıcı bu paketle bekliyor):**
- ⏳ Manuel RSS kaynak ekleme UI (YouTube kanal yöneticisi gibi: ad + URL + sıra + sil + sıfırla)
- ⏳ Auto-discover endpoint (`/api/discover?url=...` → `<link rel="alternate">` parse + fallback path'ler)
- ⏳ Breaking flag per kaynak (marquee için bu flag'li olanlar)

**Manuel yenileme:**
- ⏳ ↺ refresh butonu — her panelin header'ında. Kullanıcı tereddütlü ("polling var"); polling 60s, breaking 30s — manuel refresh marjinal değer. Düşük öncelik.

**Versioning / dağıtım:**
- ⏳ README.md (kurulum + kullanım + ekran görüntüleri)
- ⏳ LICENSE (MIT önerisi)
- ⏳ GitHub Releases otomasyonu (electron-builder `publish` config + GH Actions workflow)
- ⏳ electron-updater entegrasyonu (mevcut "manuel kontrol et" arka plana çekilsin, tek tıkla kurulum)
- Not: VersionTag + update checker UI'ı **v1.2'de eklendi** ✅ (kullanıcı listede tekrar yazmış olabilir — mevcut implementasyon manuel kontrol; yukarıdaki electron-updater bunu otomatikleştirir)

### v1.2 — RSS kaynak yönetimi (brainstorming notları)

**Karar:** YouTube kanal yönetici UI'sinin paralel kopyası — Settings'te "RSS Kaynakları" bölümü editable liste olur (ad + URL + ↑↓ sıra + sil + ekle + sıfırla). Backend `sources.json` sadece default seti tutar, kullanıcı `customSources` ile override eder (localStorage).

**Marquee/feed ilişkisi:** Tek liste, her kaynak için `breaking` flag toggle (🔴). Marquee `breaking=true` olanlardan çeker; feed hepsinden. Default seti güncelle: NTV/Cumhuriyet/Habertürk son dakika feed'lerinde `breaking: true` işaretli.

**Kaynak keşfi:** Sadece **auto-discover** — kullanıcı site URL'i girer, backend HTML çekip `<link rel="alternate" type="application/rss+xml">` parse eder, bulduğunu öneri olarak gösterir. Bulamazsa fallback path dener (`/feed`, `/rss`, `/rss.xml`, `/atom.xml`). Konu/kelime arama (FeedSpot tarzı) **kapsam dışı** — over-engineering.

**Karara bağlanmış sınırlar:**
- Default 60s polling; kaynak sayısı 15+ olursa otomatik 120s'ye çıkar (gizli, ayar değil) — siteleri yormamak için
- Kategori field'ı silinecek (şu an UI'da işlevsiz, YAGNI). Spor/Ekonomi gibi sekmeler gerekirse sonra ayrıca konuşulur
- Kanal silinince "Sıfırla" butonu default sete döner (YouTube ile aynı pattern)

**Backend değişiklikleri:**
- `sources.json` schema'ya `breaking: bool` field'ı ekle
- Yeni endpoint: `GET /api/discover?url=...` → auto-discover sonucu

### v1.3 — Tema & özelleştirme sistemi (büyük)
**Kullanıcı isteği — kapsamlı:**
- **Tema motoru:** CSS variable tabanlı, runtime'da switch
  - 4 default tema (öneri: koyu kırmızı/yayıncı, koyu mavi/finans, koyu yeşil/terminal, soluk gri/sade)
  - HEX kod ile özel renk seçici (her CSS variable için)
  - **flashcards-app reposundaki theme sistemi referans alınacak** (D:\Git Projelerim\flashcards-app — incelenecek)
- **Font seçimi:** Settings'te dropdown (sistem fontları + Google Fonts subset)
- **Marquee/ticker özelleştirme:** arka plan rengi, yazı rengi, hız (saniye), font ayrı ayrı
- **Borsa sembollerinin UI'dan özelleştirilmesi** (backend hazır, Settings'e form)

### v1.4 — Panel sistemi (büyük)
**Kullanıcı isteği:**
- **Panel resize:** kolon arasında drag handle (multitv ↔ feed genişliği), satır arasında da (marquee/ticker yükseklik)
- **Panel taşıma:** drag & drop ile yer değişimi (sağdaki feed sola, vs.)
- **Sekme kapatabilme:** panel görünürlük toggle ("sadece multitv modu", "sadece haber feed modu")
- **Layout preset'leri:** "Komuta merkezi", "Sadece TV", "Sadece haber" gibi kaydedilebilir düzenler
- Kanal slot drag & drop (↑↓ butonların yerine)

### v1.5 — RSS kaynak yönetimi
*(Önceki brainstorming kararları — yukarıdaki bölümlerde detaylı)*

### v1.6 — Diğer
- AI özet / kategorilendirme (Claude API ile haber kümeleri özetlensin)
- m3u8/HLS canlı yayın desteği (hls.js)
- Mobil/responsive layout
- Marquee item tıklayınca link aç

### v2 — Supabase backend migration
- Express'i sil, Edge Functions'a taşı (Deno tabanlı, `rss-parser` yerine Deno alternatifi)
- Kullanıcı ayarları cloud sync (çoklu cihaz)
- Free tier: 2 aktif proje sınırı içinde kalır

## Dosya Haritası

```
rss-dashboard/
├── PLAN.md
├── README.md
├── .gitignore
├── server/
│   ├── package.json
│   ├── index.js              # Express + sources/channels endpoint
│   ├── sources.json          # 10 TR haber RSS
│   ├── channels.json         # 9 YouTube kanalı
│   └── routes/
│       ├── rss.js            # rss-parser + cache (60sn)
│       └── finance.js        # Yahoo Finance + cache (30sn)
└── client/
    ├── package.json
    ├── vite.config.js        # /api → 3001 proxy
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx           # layout + localStorage settings
        ├── styles.css        # koyu tema, CSS Grid
        └── components/
            ├── MultiTV.jsx
            ├── ChannelTile.jsx
            ├── NewsFeed.jsx
            ├── NewsCard.jsx
            ├── BreakingMarquee.jsx
            ├── Ticker.jsx
            └── Settings.jsx
```
