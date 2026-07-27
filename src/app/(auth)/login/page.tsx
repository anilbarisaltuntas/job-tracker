'use client'

/**
 * LOGIN (GİRİŞ) SAYFASI - Modern Minimalizm
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
    <div className="minimal-panel p-10 max-w-sm w-full mx-auto" style={{ borderRadius: '12px' }}>

      {/* Logo / Başlık */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: 'var(--logo-bg)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" style={{ color: 'var(--logo-text)' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Giriş Yap
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Kariyer yolculuğunuza devam edin
        </p>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-[13px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Giriş Formu */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-[12px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-[13px] rounded-md transition-colors"
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
            className="mb-1.5 flex items-center justify-between text-[12px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            <span>Şifre</span>
            <Link href="#" className="text-[11px] hover:underline" style={{ color: 'var(--text-tertiary)' }}>Şifremi unuttum</Link>
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2.5 text-[13px] rounded-md transition-colors"
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
            className="h-3.5 w-3.5 rounded-sm border-gray-300 transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
            }}
          />
          <label
            htmlFor="rememberMe"
            className="ml-2 block text-[12px] cursor-pointer select-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            Beni hatırla
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md px-4 py-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            border: '1px solid var(--border)',
          }}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      {/* Kayıt linki */}
      <p className="mt-6 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
        Hesabınız yok mu?{' '}
        <Link
          href="/register"
          className="font-medium hover:underline"
          style={{ color: 'var(--text-primary)' }}
        >
          Kayıt olun
        </Link>
      </p>
    </div>
  )
}
