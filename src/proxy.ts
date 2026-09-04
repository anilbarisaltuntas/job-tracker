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
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Token'ı doğrula ve gerekiyorsa yenile. Bu çağrı veri sorgularından önce
  // yapılmalı ki yenilenen çerez aynı istekteki Server Component'lere ulaşsın.
  const { data, error } = await supabase.auth.getClaims()
  const isAuthenticated = !error && Boolean(data?.claims?.sub)

  const { pathname } = request.nextUrl

  function redirectWithSession(pathname: string) {
    const url = request.nextUrl.clone()
    url.pathname = pathname

    const response = NextResponse.redirect(url)

    // Token bu istek sırasında yenilendiyse yönlendirme cevabı da yeni oturum
    // çerezlerini ve cache güvenlik başlıklarını taşımalı.
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    supabaseResponse.headers.forEach((value, key) => {
      if (!['content-length', 'content-type', 'location', 'set-cookie'].includes(key.toLowerCase())) {
        response.headers.set(key, value)
      }
    })

    return response
  }

  // Giriş yapmamış kullanıcı korumalı sayfaya gitmeye çalışırsa → /login'e yönlendir
  if (!isAuthenticated && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    return redirectWithSession('/login')
  }

  // Giriş yapmış kullanıcı login/register sayfasına gitmeye çalışırsa → /overview'a yönlendir
  if (isAuthenticated && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return redirectWithSession('/overview')
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
