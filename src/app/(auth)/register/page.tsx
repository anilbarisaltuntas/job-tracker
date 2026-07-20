'use client'

/**
 * REGISTER (KAYIT) SAYFASI
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

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/board')
      router.refresh()
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--text-primary)',
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
          Yeni hesap oluştur
        </p>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Kayıt Formu */}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
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
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)' }}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
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
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)' }}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
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
            className="w-full rounded-lg px-4 py-2.5 outline-none transition-colors"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)' }}
          />
          {confirmPassword && (
            <p className={`mt-1.5 text-xs ${password === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
              {password === confirmPassword ? '✓ Şifreler eşleşiyor' : '✗ Şifreler eşleşmiyor'}
            </p>
          )}
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
              Hesap oluşturuluyor...
            </span>
          ) : (
            'Kayıt Ol'
          )}
        </button>
      </form>

      {/* Giriş linki */}
      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Zaten hesabınız var mı?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-500 transition-colors hover:text-blue-400"
        >
          Giriş Yap
        </Link>
      </p>
    </div>
  )
}
