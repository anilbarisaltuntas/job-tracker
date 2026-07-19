-- =============================================
-- JOB TRACKER - VERİTABANI OLUŞTURMA
-- Bu SQL'i Supabase SQL Editor'e yapıştırıp çalıştır
-- =============================================

-- =============================================
-- 1. APPLICATIONS (Başvurular) TABLOSU
-- =============================================
-- Her satır bir iş başvurusunu temsil eder.
-- user_id sayesinde her kullanıcı sadece kendi başvurularını görür.

CREATE TABLE applications (
  -- Birincil anahtar: her başvurunun benzersiz kimliği
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Bu başvuru hangi kullanıcıya ait? (Supabase Auth'taki kullanıcıya bağlanır)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Temel bilgiler
  company_name TEXT NOT NULL,                    -- Şirket adı (zorunlu)
  position TEXT NOT NULL,                        -- Pozisyon adı (zorunlu)
  cv_version TEXT,                               -- Kullanılan CV versiyonu
  application_date DATE DEFAULT CURRENT_DATE NOT NULL,  -- Başvuru tarihi
  
  -- İletişim kişisi bilgileri
  contact_name TEXT,                             -- İletişim kişisi adı
  contact_role TEXT,                             -- İletişim kişisi rolü
  contact_email TEXT,                            -- İletişim kişisi email
  
  -- Mesaj takibi
  message_sent BOOLEAN DEFAULT FALSE,            -- Mesaj gönderildi mi?
  message_date DATE,                             -- Mesaj gönderim tarihi
  
  -- Durum ve takip
  status TEXT DEFAULT 'applied_message_pending' NOT NULL,  -- Kanban durumu
  follow_up_date DATE,                           -- Takip hatırlatma tarihi
  
  -- Ek bilgiler
  source TEXT,                                   -- Başvuru kaynağı (linkedin, indeed...)
  job_url TEXT,                                  -- İş ilanı linki
  notes TEXT,                                    -- Serbest notlar
  
  -- Kanban sıralama (sütun içinde kartların sırası)
  kanban_order INTEGER DEFAULT 0 NOT NULL,
  
  -- Otomatik zaman damgaları
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- 2. NOTIFICATIONS (Bildirimler) TABLOSU
-- =============================================
-- Takip tarihi geçen başvurular için oluşturulan bildirimler.

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- 3. UPDATED_AT OTOMATİK GÜNCELLEME
-- =============================================
-- Bir başvuru her güncellendiğinde updated_at otomatik değişir.
-- Bu bir "trigger" — veritabanı seviyesinde otomatik çalışan fonksiyon.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) — Satır Bazlı Güvenlik
-- =============================================
-- RLS NEDİR?
-- Normalde veritabanına erişen herkes her şeyi görebilir.
-- RLS ile "her kullanıcı SADECE KENDİ verisini görebilir" kuralını
-- veritabanı seviyesinde zorunlu kılıyoruz.
-- Yani biri API'yi hacklese bile başkasının verisine erişemez!

-- Applications tablosu için RLS'i aktif et
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece KENDİ başvurularını görebilir
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcı sadece KENDİ adına başvuru ekleyebilir
CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcı sadece KENDİ başvurularını güncelleyebilir
CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Kullanıcı sadece KENDİ başvurularını silebilir
CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);

-- Notifications tablosu için RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 5. INDEXLER — Hızlı Sorgulama
-- =============================================
-- Index, kitabın arkasındaki "dizin" gibidir.
-- Veritabanı tüm satırları taramak yerine index'ten hızlıca bulur.

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_follow_up ON applications(follow_up_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
