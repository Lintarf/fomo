# FOMO AI Trading Analyst

Sistem analisis trading yang diperkuat dengan AI untuk membantu trader membuat keputusan yang lebih baik berdasarkan analisis teknikal yang mendalam.

## 🚀 Fitur Utama

### 1. **AI-Powered Chart Analysis**
- Upload screenshot chart trading
- Analisis teknikal otomatis dengan AI
- Identifikasi pola dan indikator
- Sinyal trading dengan confidence score
- Support untuk 4 mode trading: Scalp, Day, Swing, Position

### 2. **Dashboard Performance**
- Tracking win rate dan statistik trading
- Analisis kinerja per mode trading
- AI Performance Analyst untuk insight
- Metrik lanjutan dan psikologi trading

### 3. **Portfolio Management**
- Manajemen aset portfolio
- Tracking profit/loss
- AI Financial Advisor
- Analisis alokasi portfolio

### 4. **Community Features**
- Berbagi analisis dengan komunitas
- Like/dislike dan komentar
- Leaderboard dan statistik komunitas

### 5. **Economic Calendar**
- Kalender ekonomi penting
- Impact level untuk setiap event
- Data actual vs forecast

## 🛠️ Teknologi

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (Database + Auth)
- **AI**: Gemini API (GPT-4o) untuk analisis chart
- **Styling**: Tailwind CSS
- **Charts**: TradingView integration

## 📦 Instalasi

1. **Clone repository**
```bash
git clone https://github.com/yourusername/fomo-ai-trading-analyst.git
cd fomo-ai-trading-analyst
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Supabase**
- Buat project di [Supabase](https://supabase.com)
- Copy URL dan anon key ke `services/supabaseService.ts`
- Jalankan SQL scripts di folder root:
  - `user_setup.sql`
  - `community_tables.sql`

4. **Setup Gemini API**
- Dapatkan API key dari [Google AI Studio](https://aistudio.google.com)
- Set API key di Settings setelah login

5. **Run development server**
```bash
npm run dev
```

## 🔧 Konfigurasi

### Supabase Setup
1. Buat project baru di Supabase
2. Update `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `services/supabaseService.ts`
3. Jalankan SQL scripts untuk setup database

### Gemini API Setup
1. Dapatkan API key dari Google AI Studio
2. Login ke aplikasi
3. Buka Settings
4. Masukkan API key untuk mengaktifkan fitur AI

## 📱 Penggunaan

### 1. **Login/Register**
- Klik "Get Started" di homepage
- Register dengan email dan password
- Login untuk mengakses dashboard

### 2. **Trading Analysis**
- Buka menu "Trading Analysis"
- Pilih mode trading (Scalp/Day/Swing/Position)
- Upload screenshot chart
- Klik "Analyze Chart"
- Review hasil analisis AI
- Save trade ke dashboard

### 3. **Dashboard**
- Lihat statistik trading
- Filter berdasarkan mode trading
- Review AI performance analysis
- Track win rate dan profit/loss

### 4. **Portfolio**
- Tambah aset portfolio
- Track nilai dan profit/loss
- Dapatkan saran AI untuk portfolio

### 5. **Community**
- Share analisis trading
- Lihat analisis dari trader lain
- Like dan komentar

## 🎯 Mode Trading

### **Scalp Trading**
- Timeframe: 1-minute only
- Minimum RRR: 1:1
- Ultra short-term trades

### **Day Trading**
- Timeframe: 5-minute & 15-minute
- Minimum RRR: 1:1.5
- Intraday trades

### **Swing Trading**
- Timeframe: 30-minute & 1-hour
- Minimum RRR: 1:2
- Multi-day trades

### **Position Trading**
- Timeframe: Daily & Weekly
- Minimum RRR: 1:3
- Long-term trades

## 🔒 Keamanan

- Authentication dengan Supabase Auth
- API keys disimpan aman di database
- Validasi input di semua form
- Error handling yang komprehensif

## 🚨 Disclaimer

**Peringatan Risiko Trading:**
- Trading mengandung risiko tinggi
- AI analysis hanya untuk referensi
- Selalu lakukan analisis sendiri
- Jangan investasi lebih dari yang bisa Anda rugikan
- Sistem ini tidak menjamin profit

## 📄 License

MIT License - lihat file LICENSE untuk detail

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📞 Support

- Email: support@fomo-ai.com
- Discord: [Join our community](https://discord.gg/fomo-ai)
- Documentation: [Wiki](https://github.com/yourusername/fomo-ai-trading-analyst/wiki)

---

**FOMO AI Trading Analyst** - Empowering traders with AI-driven insights 🚀
