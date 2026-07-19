-- =============================================
-- İLETİŞİM KİŞİLERİ TABLOSU
-- Bu SQL'i Supabase SQL Editor'de çalıştır
-- =============================================

-- Bir başvuruya birden fazla iletişim kişisi eklenebilir.
-- Her kişi için ayrı mesaj/mail gönderim durumu takip edilir.

CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Kişi bilgileri
  name TEXT NOT NULL,                  -- Ad Soyad
  role TEXT,                           -- Rol/Ünvan (HR Manager, CTO, vb.)
  email TEXT,                          -- E-posta adresi
  
  -- Mesaj takibi (LinkedIn mesajı vb.)
  message_sent BOOLEAN DEFAULT FALSE,
  message_date DATE,
  
  -- Mail takibi
  email_sent BOOLEAN DEFAULT FALSE,
  email_date DATE,
  
  -- Notlar
  notes TEXT,
  
  -- Sıralama ve zaman
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS güvenlik kuralları
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE USING (auth.uid() = user_id);

-- Hızlı sorgulama için index
CREATE INDEX idx_contacts_application_id ON contacts(application_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);

-- =============================================
-- Eski tek kişilik alanları kaldırmıyoruz (mevcut veri korunur)
-- Ama artık yeni kişiler contacts tablosuna eklenecek.
-- =============================================
