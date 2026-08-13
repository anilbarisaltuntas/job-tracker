'use client'

/**
 * LOGIN (GİRİŞ) SAYFASI - Modern SaaS Design
 */

import { useEffect, useMemo, useState } from 'react'
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
      // Restore the explicitly remembered browser preference after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

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
      router.push('/overview')
      router.refresh()
    }
  }

  return (
    <div className="modern-card p-8 max-w-md w-full mx-auto relative overflow-hidden shadow-xl" style={{ borderRadius: '16px' }}>

      {/* Üst Logo & Başlık */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
          style={{ background: 'var(--logo-bg)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Giriş Yap
        </h1>
        <p className="mt-1.5 text-xs font-medium text-[var(--text-tertiary)]">
          Başvuru Pusulası ile kariyer hedeflerinizi yönetin
        </p>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Giriş Formu */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]"
          >
            E-posta Adresi
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="örnek@eposta.com"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl transition-all"
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
            className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]"
          >
            <span>Şifre</span>
            <Link href="#" className="text-[11px] font-normal text-[var(--accent)] hover:underline">Şifremi unuttum</Link>
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl transition-all"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Beni Hatırla Checkbox */}
        <div className="flex items-center pt-1">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded-md border-[var(--input-border)] transition-colors cursor-pointer accent-[var(--accent)]"
          />
          <label
            htmlFor="rememberMe"
            className="ml-2 block text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none"
          >
            Beni hatırla
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:scale-[1.01] active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
          }}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      {/* Kayıt linki */}
      <p className="mt-8 text-center text-xs font-medium text-[var(--text-tertiary)] border-t border-[var(--border)] pt-5">
        Hesabınız yok mu?{' '}
        <Link
          href="/register"
          className="font-bold text-[var(--accent)] hover:underline"
        >
          Hemen Kayıt Olun
        </Link>
      </p>
    </div>
  )
}
