'use client'

/**
 * LOGIN (GİRİŞ) SAYFASI
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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
    <div
      className="rounded-2xl p-8 shadow-2xl backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
      }}
    >
      {/* Logo / Başlık */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold shadow-lg"
          style={{ backgroundColor: 'var(--logo-bg)', color: 'var(--logo-text)' }}
        >
          J
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          JobTracker
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          İş başvurularını takip et, organize ol
        </p>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Giriş Formu */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium"
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
            className="w-full rounded-lg px-4 py-2.5 outline-none transition-colors"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)' }}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium"
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
            className="w-full rounded-lg px-4 py-2.5 outline-none transition-colors"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2.5 font-medium shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)' }}
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
      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Hesabınız yok mu?{' '}
        <Link
          href="/register"
          className="font-medium text-blue-500 transition-colors hover:text-blue-400"
        >
          Kayıt Ol
        </Link>
      </p>
    </div>
  )
}
