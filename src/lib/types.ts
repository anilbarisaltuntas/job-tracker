/**
 * TİPLER (TYPES) NEDİR?
 * 
 * TypeScript'te "tip" tanımları, verinin şeklini önceden belirler.
 * Böylece yanlış alan adı yazarsan veya eksik veri gönderirsen
 * KOD ÇALIŞMADAN ÖNCE hata alırsın. Bu, runtime hatalarını önler.
 * 
 * Örnek: Application tipinde "company_name" alanı var.
 * Yanlışlıkla "companyName" yazarsan TypeScript anında uyarır.
 */

/** Kanban board'daki durum değerleri */
export type ApplicationStatus = string

/** Başvuru kaynağı */
export type ApplicationSource =
  | 'linkedin'
  | 'indeed'
  | 'kariyer_net'
  | 'referral'
  | 'company_website'
  | 'other'

/** Bir iletişim kişisinin veri yapısı */
export interface Contact {
  id: string
  application_id: string
  user_id: string
  name: string
  role: string | null
  email: string | null
  message_sent: boolean
  message_date: string | null
  email_sent: boolean
  email_date: string | null
  notes: string | null
  sort_order: number
  created_at: string
}

/** Yeni kişi eklerken kullanılacak geçici tip (henüz DB'ye kaydedilmemiş) */
export interface ContactFormData {
  id?: string            // varsa düzenleme, yoksa yeni
  name: string
  role: string
  email: string
  message_sent: boolean
  message_date: string
  email_sent: boolean
  email_date: string
  notes: string
}

/** Bir iş başvurusunun tam veri yapısı */
export interface Application {
  id: string
  user_id: string
  company_name: string
  position: string
  cv_version: string | null
  application_date: string
  contact_name: string | null       // eski alan (geriye uyumluluk)
  contact_role: string | null       // eski alan
  contact_email: string | null      // eski alan
  message_sent: boolean             // eski alan
  message_date: string | null       // eski alan
  status: ApplicationStatus
  follow_up_date: string | null
  source: ApplicationSource | null
  job_url: string | null
  notes: string | null
  cv_file_url: string | null        // yeni: yüklenen PDF dosyasının adresi
  kanban_order: number
  created_at: string
  updated_at: string
  contacts?: Contact[]              // yeni: çoklu iletişim kişileri (join ile gelir)
}

/** Yeni başvuru oluştururken gönderilecek veri (id, tarihler otomatik oluşur) */
export type CreateApplicationInput = Omit<
  Application,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

/** Başvuru güncellerken gönderilecek veri (tüm alanlar opsiyonel) */
export type UpdateApplicationInput = Partial<CreateApplicationInput>

/** Bildirim veri yapısı */
export interface Notification {
  id: string
  user_id: string
  application_id: string
  message: string
  is_read: boolean
  created_at: string
  application?: Application // İlişkili başvuru (join ile gelir)
}

/** Geçmiş / Log veri yapısı */
export interface ApplicationHistory {
  id: string
  application_id: string
  user_id: string
  event_type: 'CREATED' | 'STATUS_CHANGED' | string
  old_status: ApplicationStatus | null
  new_status: ApplicationStatus | null
  description: string
  created_at: string
}

/** Kaydedilen / Planlanan İlan */
export interface SavedJob {
  id: string
  user_id: string
  company_name: string
  position: string
  posted_date: string | null
  job_url: string | null
  is_cv_updated: boolean
  is_message_drafted: boolean
  is_applied: boolean
  created_at: string
}

/** Kullanıcıya Özel Kanban Statüsü */
export interface UserStatus {
  id: string
  user_id: string
  title: string
  emoji: string
  color: string
  bg_color: string
  order_index: number
  created_at?: string
}

/** Görev Yöneticisi (To-Do List) için Görev Tipi */
export type TodoStatus = 'pending' | 'in_progress' | 'completed'
export type TodoPriority = 'low' | 'medium' | 'high'
export type TodoCategory = 'general' | 'interview' | 'cv' | 'networking'

export interface TodoTask {
  id: string
  user_id: string
  application_id: string | null
  title: string
  description: string | null
  status: TodoStatus
  priority: TodoPriority
  category: TodoCategory
  due_date: string | null
  created_at: string
  updated_at: string
  
  // JOIN ile gelecek olan application detayı
  application?: Application
}

export type TodoTaskFormData = Omit<TodoTask, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'application'>
