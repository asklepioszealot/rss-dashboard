# RSS Dashboard

Yayıncı tarzı haber komuta merkezi: solda 3x3 multiTV (YouTube canlı yayın), sağda RSS haber akışı, üstte son dakika marquee, altta borsa ticker'ı.

## Çalıştırma

İki terminal:

```bash
# 1) Backend (port 3001)
cd server
npm install
npm run dev

# 2) Frontend (port 5173)
cd client
npm install
npm run dev
```

Vite dev server `/api/*` isteklerini otomatik olarak backend'e proxy'ler. Tarayıcıdan `http://localhost:5173` aç.

## Yapı

- `server/` — Express + rss-parser + node-cache, Yahoo Finance proxy
- `client/` — React + Vite, koyu tema, localStorage ayarlar
- `server/sources.json` — RSS kaynakları (düzenlenebilir)
- `server/channels.json` — YouTube kanal ID'leri (düzenlenebilir)

## Notlar

- YouTube canlı yayın embed'leri channel ID'ye bağlı; `channels.json`'daki ID'ler tahmindir, çalışmayan varsa düzelt.
- RSS kaynak URL'leri zaman zaman değişir; çalışmayan feed konsola hata yazar, diğerleri etkilenmez.
- Borsa için Yahoo Finance public endpoint kullanılır, anahtar gerekmez.
