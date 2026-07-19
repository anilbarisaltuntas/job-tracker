'use client'

/**
 * HEADER — Üst Menü Çubuğu
 * 
 * Sayfanın üstünde sabit duran navigasyon çubuğu.
 * İçindekiler: Logo, kullanıcı bilgisi, çıkış butonu.
 */

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Header() {
  const [userEmail, setUserEmail] = useState<string>('')
  const supabase = createClient()
  const router = useRouter()

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
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Sol: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-lg shadow-lg">
            💼
          </div>
          <h1 className="text-lg font-bold text-white">JobTracker</h1>
        </div>

        {/* Sağ: Kullanıcı bilgisi + Çıkış */}
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-400 sm:block">
            {userEmail}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </header>
  )
}
