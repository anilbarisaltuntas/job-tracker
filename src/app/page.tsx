import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * ANA SAYFA (/)
 * 
 * Bu bir Server Component — sunucuda çalışır, tarayıcıya HTML gönderir.
 * Kullanıcı siteye girdiğinde:
 * - Giriş yapmışsa → /overview'a yönlendir
 * - Giriş yapmamışsa → /login'e yönlendir (middleware zaten yapıyor ama güvenlik için)
 */
export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/overview')
  } else {
    redirect('/login')
  }
}
