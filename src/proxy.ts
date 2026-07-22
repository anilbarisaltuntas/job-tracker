import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * MIDDLEWARE NEDİR?
 * 
 * Next.js middleware, kullanıcı herhangi bir sayfaya gittiğinde
 * sayfa yüklenmeden ÖNCE çalışan bir fonksiyondur.
 * 
 * Biz burada şunları yapıyoruz:
 * 1. Supabase oturumunu yeniliyoruz (token süresi dolmuşsa)
 * 2. Giriş yapmamış kullanıcıyı /login'e yönlendiriyoruz
 * 3. Giriş yapmış kullanıcıyı /login'den /board'a yönlendiriyoruz
 */
export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Oturumu kontrol et (ve gerekirse yenile)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Giriş yapmamış kullanıcı korumalı sayfaya gitmeye çalışırsa → /login'e yönlendir
  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Giriş yapmış kullanıcı login/register sayfasına gitmeye çalışırsa → /board'a yönlendir
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/board'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

/**
 * MATCHER: Middleware'in HANGİ sayfalarda çalışacağını belirler.
 * Statik dosyalar (_next, favicon vb.) hariç tüm sayfalarda çalışır.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
