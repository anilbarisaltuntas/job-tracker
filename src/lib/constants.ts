import { ApplicationStatus, ApplicationSource } from './types'

/**
 * SABİTLER (CONSTANTS) NEDİR?
 * 
 * Uygulamada birden fazla yerde kullanılan değişmeyen değerler.
 * Bunları tek bir yerde tanımlarsak:
 * 1. Bir yerde değiştirince her yerde değişir
 * 2. Yazım hatası riski azalır
 * 3. Kod daha okunabilir olur
 */

/** Kanban sütunlarının sırası, renkleri ve Türkçe etiketleri */
export const KANBAN_COLUMNS: {
  id: ApplicationStatus
  title: string
  emoji: string
  color: string       // Tailwind bg rengi (kart üst çizgisi için)
  bgColor: string     // Sütun arka plan rengi
}[] = [
  {
    id: 'applied_message_pending',
    title: 'Başvuruldu - Mesaj Atılacak',
    emoji: '📤',
    color: '#3B82F6',     // Mavi
    bgColor: '#EFF6FF',
  },
  {
    id: 'applied_message_sent',
    title: 'Başvuruldu - Mesaj Atıldı',
    emoji: '💬',
    color: '#8B5CF6',     // Mor
    bgColor: '#F5F3FF',
  },
  {
    id: 'applied_no_reply_email_pending',
    title: 'Dönüş Gelmedi - Mail Atılacak',
    emoji: '📧',
    color: '#F59E0B',     // Turuncu
    bgColor: '#FFFBEB',
  },
  {
    id: 'email_sent_waiting',
    title: 'Mail Atıldı - Dönüş Bekleniyor',
    emoji: '⏳',
    color: '#06B6D4',     // Cyan
    bgColor: '#ECFEFF',
  },
  {
    id: 'reply_received',
    title: 'Mesaj Dönüşü Geldi',
    emoji: '✉️',
    color: '#10B981',     // Yeşil
    bgColor: '#ECFDF5',
  },
  {
    id: 'interview_done_waiting',
    title: 'Mülakat Yapıldı - Dönüş Bekleniyor',
    emoji: '💼',
    color: '#6366F1',     // İndigo
    bgColor: '#EEF2FF',
  },
  {
    id: 'rejected',
    title: 'Reddedildi',
    emoji: '❌',
    color: '#EF4444',     // Kırmızı
    bgColor: '#FEF2F2',
  },
  {
    id: 'offer_received',
    title: 'Teklif Alındı',
    emoji: '🎉',
    color: '#22C55E',     // Parlak yeşil
    bgColor: '#F0FDF4',
  },
]

/** Başvuru kaynağı seçenekleri (dropdown için) */
export const APPLICATION_SOURCES: {
  value: ApplicationSource
  label: string
}[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'kariyer_net', label: 'Kariyer.net' },
  { value: 'referral', label: 'Referans' },
  { value: 'company_website', label: 'Şirket Websitesi' },
  { value: 'other', label: 'Diğer' },
]
