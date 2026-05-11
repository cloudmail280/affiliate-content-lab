# Affiliate Content Lab

Web app personal untuk affiliator TikTok/Shopee niche fashion. Auto-generate konten dari produk yang di-pick dari Kalodata/Fastmoss.

## Features (MVP)

- **Tambah Produk**: Paste link Shopee/TikTok Shop + input manual
- **Auto Generate**: 10 hook, 5 caption, 20 hashtag, 3 content angle, 5 cover text, 5 CTA
- **Copy-Paste Mode**: Semua bahan siap copy per field
- **Library**: Semua produk tersimpan dengan status draft/posted/archived

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Deploy**: Vercel

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/cloudmail280/affiliate-content-lab.git
cd affiliate-content-lab
pnpm install
```

### 2. Setup Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. Jalankan SQL di `supabase/schema.sql` via SQL Editor
3. Copy URL dan Anon Key dari Settings > API

### 3. Setup Gemini API

1. Buat API key di [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Copy API key

### 4. Environment Variables

```bash
cp .env.local.example .env.local
```

Isi semua value di `.env.local`

### 5. Run Development

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Deploy ke Vercel

1. Push ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Set environment variables di Vercel dashboard
4. Deploy!

## Alur Penggunaan

1. Buka app → Tambah Produk
2. Paste link Shopee/TikTok (opsional) + isi nama produk + notes
3. Klik "Simpan & Generate Konten"
4. AI otomatis generate semua bahan konten
5. Copy-paste per item ke TikTok/Shopee
6. Update status produk di Library (draft → posted → archived)

## Roadmap

- [ ] Auth (multi-user)
- [ ] Upload foto produk
- [ ] Video script analyzer
- [ ] Analytics dashboard
- [ ] Bulk generate
- [ ] Template konten custom
