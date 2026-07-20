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
    <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#0A0A0A]/60 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Sol: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
            <span className="text-sm font-bold text-black">J</span>
          </div>
          <h1 className="text-base font-semibold tracking-tight text-white/90">JobTracker</h1>
        </div>

        {/* Sağ: Kullanıcı bilgisi + Çıkış */}
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-white/40 sm:block">
            {userEmail}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/90"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </header>
  )
}
