import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Sunucu (Server Component, API Route, Server Action) tarafında
 * kullanılacak Supabase client.
 * 
 * Next.js'in cookie API'sini kullanarak kullanıcı oturumunu okur/yazar.
 * Bu fonksiyon her çağrıldığında YENI bir client oluşturur (stateless).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component'te cookie set edilemez, bu normal.
            // Middleware'de halledilir.
          }
        },
      },
    }
  )
}
