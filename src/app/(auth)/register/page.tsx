'use client'

/**
 * REGISTER (KAYIT) SAYFASI
 * 
 * Login sayfasına çok benzer. Fark:
 * - signInWithPassword yerine signUp kullanıyoruz
 * - Şifre tekrarı alanı var
 * - Başarılı kayıt sonrası bilgilendirme mesajı gösteriyoruz
 *   (Supabase varsayılan olarak email doğrulama ister,
 *    ama bunu dashboard'dan kapatacağız)
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Şifre eşleşme kontrolü (frontend tarafında)
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }

    setLoading(true)

    // Supabase'e kayıt isteği gönder
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Kayıt başarılı → Board'a yönlendir
      router.push('/board')
      router.refresh()
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
          Yeni hesap oluştur
        </p>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Kayıt Formu */}
      <form onSubmit={handleRegister} className="space-y-4">
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

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-300">
            Şifre Tekrar
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {/* Şifre eşleşme göstergesi */}
          {confirmPassword && (
            <p className={`mt-1.5 text-xs ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
              {password === confirmPassword ? '✓ Şifreler eşleşiyor' : '✗ Şifreler eşleşmiyor'}
            </p>
          )}
        </div>

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
              Hesap oluşturuluyor...
            </span>
          ) : (
            'Kayıt Ol'
          )}
        </button>
      </form>

      {/* Giriş linki */}
      <p className="mt-6 text-center text-sm text-slate-400">
        Zaten hesabınız var mı?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          Giriş Yap
        </Link>
      </p>
    </div>
  )
}
