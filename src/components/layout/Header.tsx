'use client'

/**
 * HEADER — Üst Menü Çubuğu
 * 
 * Sayfanın üstünde sabit duran navigasyon çubuğu.
 * İçindekiler: Logo, tema değiştirici, kullanıcı bilgisi, çıkış butonu.
 */

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'

export default function Header() {
  const [userEmail, setUserEmail] = useState<string>('')
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserEmail(user.email || '')
    }
    getUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex h-14 items-center justify-between px-6">
        {/* Sol: Logo ve Navigasyon */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ backgroundColor: 'var(--logo-bg)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--logo-text)' }}>J</span>
            </div>
            <h1
              className="text-base font-semibold tracking-tight hidden sm:block"
              style={{ color: 'var(--text-primary)' }}
            >
              JobTracker
            </h1>
          </div>

          <nav className="flex items-center gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <Link 
              href="/board"
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                pathname === '/board' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-500/10'
              }`}
            >
              📋 Pano
            </Link>
            <Link 
              href="/todos"
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                pathname === '/todos' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-500/10'
              }`}
            >
              ✅ Görevler
            </Link>
            <Link 
              href="/saved"
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                pathname === '/saved' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-500/10'
              }`}
            >
              ⭐ Kaydedilenler
            </Link>
            <Link 
              href="/settings"
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                pathname === '/settings' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-500/10'
              }`}
            >
              ⚙️ Sütun Ayarları
            </Link>
          </nav>
        </div>

        {/* Sağ: Tema + Kullanıcı bilgisi + Çıkış */}
        <div className="flex items-center gap-3">
          {/* Tema değiştirme butonu */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{
              color: 'var(--text-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
            title={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <span className="hidden text-sm sm:block" style={{ color: 'var(--text-tertiary)' }}>
            {userEmail}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </header>
  )
}
