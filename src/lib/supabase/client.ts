import { createBrowserClient } from '@supabase/ssr'

/**
 * Tarayıcı (Client Component) tarafında kullanılacak Supabase client.
 * 
 * "use client" ile işaretlenmiş bileşenlerde bu fonksiyonu çağırırız.
 * Cookie'leri otomatik yönetir — kullanıcı oturumunu takip eder.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
