-- =============================================
-- CV DEPOLAMA VE YENİ KOLON EKLENTİSİ
-- Bu SQL'i Supabase SQL Editor'de çalıştır
-- =============================================

-- 1. Applications tablosuna cv_file_url kolonu ekle
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS cv_file_url TEXT;

-- 2. "cv-files" adında yeni bir depolama alanı (bucket) oluştur
-- Supabase'de storage.buckets tablosuna kayıt atılır
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cv-files', 'cv-files', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Güvenlik Kuralları (RLS)
-- Kullanıcıların sadece kendi dosyalarını yükleyip/güncelleyip/silebileceği kurallar

-- Herkes public bucket'tan dosyaları okuyabilir
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'cv-files' );

-- Sadece giriş yapmış kullanıcılar kendi ID'leriyle başlayan klasörlere dosya yükleyebilir
CREATE POLICY "Users can upload their own CVs" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'cv-files' AND 
  auth.uid() = owner
);

-- Kullanıcılar kendi dosyalarını güncelleyebilir
CREATE POLICY "Users can update their own CVs" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'cv-files' AND 
  auth.uid() = owner
);

-- Kullanıcılar kendi dosyalarını silebilir
CREATE POLICY "Users can delete their own CVs" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'cv-files' AND 
  auth.uid() = owner
);
