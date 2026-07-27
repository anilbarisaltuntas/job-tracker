'use client'

/**
 * LOGIN (GİRİŞ) SAYFASI - WOW Design
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
    } else {
      router.push('/board')
      router.refresh()
    }
  }

  return (
    <div className="glass-panel relative z-10 rounded-[2rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* Kartın içine çok hafif ekstra ışık eklendi */}
      <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-r from-[var(--accent)] to-transparent opacity-20 blur-3xl pointer-events-none" />

      {/* Logo / Başlık */}
      <div className="mb-10 text-center relative z-10">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-[0_0_20px_var(--glow-color)] transition-transform hover:scale-110 hover:rotate-3 duration-300"
          style={{ background: 'var(--logo-bg)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient-animated">
          Başvuru Pusulası
        </h1>
        <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
          Kariyerini parmaklarının ucunda yönet.
        </p>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pop-in relative z-10">
          {error}
        </div>
      )}

      {/* Giriş Formu */}
      <form onSubmit={handleLogin} className="space-y-5 relative z-10">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-bold tracking-wide uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            required
            className="w-full rounded-xl px-5 py-3 outline-none transition-all duration-300 focus:-translate-y-1"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-bold tracking-wide uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
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
            className="w-full rounded-xl px-5 py-3 outline-none transition-all duration-300 focus:-translate-y-1"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Beni Hatırla Checkbox */}
        <div className="flex items-center pt-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-5 w-5 rounded border-transparent text-pink-500 focus:ring-pink-500/50 focus:ring-offset-0 transition-colors"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)'
            }}
          />
          <label
            htmlFor="rememberMe"
            className="ml-3 block text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Beni hatırla
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-xl px-4 py-3.5 text-[15px] font-extrabold tracking-wide uppercase shadow-[0_0_20px_var(--glow-color)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.02] hover:shadow-[0_0_30px_var(--glow-color)]"
          style={{
            background: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
      <p className="mt-8 text-center text-sm font-medium relative z-10" style={{ color: 'var(--text-tertiary)' }}>
        Hesabınız yok mu?{' '}
        <Link
          href="/register"
          className="font-bold tracking-wide transition-all duration-300 hover:text-[var(--accent)] hover:underline"
          style={{ color: 'var(--text-primary)' }}
        >
          Hemen Kayıt Ol
        </Link>
      </p>
    </div>
  )
}
