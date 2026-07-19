'use client'

/**
 * LOGIN (GİRİŞ) SAYFASI
 * 
 * 'use client' → Bu dosya tarayıcıda çalışır (Server Component değil).
 * Neden? Çünkü:
 *   - useState ile form verilerini tutuyoruz
 *   - onClick ile butona tıklamayı dinliyoruz
 *   - Bunlar sadece tarayıcıda çalışan özellikler
 * 
 * AKIŞ:
 * 1. Kullanıcı email + şifre girer
 * 2. "Giriş Yap" butonuna basar
 * 3. Supabase Auth API'sine istek gider
 * 4. Doğruysa → /board'a yönlendir
 * 5. Yanlışsa → hata mesajı göster
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  // STATE (Durum) — Formun anlık değerlerini tutar
  const [email, setEmail] = useState('')           // Email input'unun değeri
  const [password, setPassword] = useState('')     // Şifre input'unun değeri
  const [error, setError] = useState<string | null>(null)  // Hata mesajı
  const [loading, setLoading] = useState(false)    // "Giriş yapılıyor..." durumu

  // Router — sayfalar arası yönlendirme için
  const router = useRouter()
  // Supabase client — auth işlemleri için
  const supabase = createClient()

  /**
   * Form gönderildiğinde çalışan fonksiyon.
   * async/await → Supabase'den cevap gelene kadar bekler.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()  // Sayfanın yenilenmesini engelle (formun varsayılan davranışı)
    setLoading(true)
    setError(null)

    // Supabase'e giriş isteği gönder
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
    } else {
      // Başarılı giriş → Kanban board'a yönlendir
      router.push('/board')
      router.refresh() // Middleware'in yeni oturumu görmesi için
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      {/* Logo / Başlık */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-lg">
          💼
        </div>
        <h1 className="text-2xl font-bold text-white">JobTracker</h1>
        <p className="mt-2 text-sm text-slate-400">
          İş başvurularını takip et, organize ol
        </p>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Giriş Formu */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email alanı */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Şifre alanı */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Giriş butonu */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all hover:from-blue-600 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Giriş yapılıyor...
            </span>
          ) : (
            'Giriş Yap'
          )}
        </button>
      </form>

      {/* Kayıt linki */}
      <p className="mt-6 text-center text-sm text-slate-400">
        Hesabınız yok mu?{' '}
        <Link
          href="/register"
          className="font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          Kayıt Ol
        </Link>
      </p>
    </div>
  )
}
