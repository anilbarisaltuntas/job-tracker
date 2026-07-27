'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { TodoTask } from '@/lib/types'
import { useTheme } from '@/context/ThemeContext'

export default function Header() {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const [dueTasks, setDueTasks] = useState<TodoTask[]>([])
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? null)
      }
    }
    getUser()
  }, [supabase.auth])

  useEffect(() => {
    const checkNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date().toISOString()
      
      const { data } = await supabase
        .from('todo_tasks')
        .select('*, application:applications(company_name)')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .lte('due_date', now)
        .order('due_date', { ascending: false })
        
      if (data) {
        setDueTasks(prevTasks => {
          if (data.length > prevTasks.length && Notification.permission === 'granted') {
            const newTasks = data.filter(d => !prevTasks.find(p => p.id === d.id))
            newTasks.forEach(task => {
              new Notification('Hatırlatıcı: ' + task.title, {
                body: task.application?.company_name ? `🏢 ${task.application.company_name} için vaktiniz geldi.` : 'Görevinizin vakti geldi.',
                icon: '/favicon.ico'
              })
            })
          }
          return data
        })
      }
    }
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission()
      }
    }
    
    checkNotifications()
    const interval = setInterval(checkNotifications, 60000)
    return () => clearInterval(interval)
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="sticky top-4 z-40 mx-auto w-full max-w-7xl px-4 animate-pop-in">
      <header className="glass-panel flex h-16 items-center justify-between rounded-2xl px-6 shadow-2xl">
        {/* Sol: Logo ve Navigasyon */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
              style={{ background: 'var(--logo-bg)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" style={{ color: 'var(--logo-text)' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
            <h1 className="text-gradient-animated hidden text-lg font-bold tracking-tight sm:block">
              Başvuru Pusulası
            </h1>
          </div>

          <nav className="flex items-center gap-2">
            {[
              { href: '/board', label: 'Pano', icon: '✨' },
              { href: '/todos', label: 'Görevler', icon: '🎯' },
              { href: '/saved', label: 'Kaydedilenler', icon: '⭐' },
              { href: '/settings', label: 'Ayarlar', icon: '⚙️' },
            ].map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)] shadow-[inset_0_0_10px_var(--glow-accent)]' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className={isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}>{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <span 
                      className="absolute -bottom-0.5 left-1/2 h-[3px] w-1/2 -translate-x-1/2 rounded-t-md bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] shadow-[0_0_8px_var(--accent)]"
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sağ: Bildirimler + Tema + Kullanıcı bilgisi + Çıkış */}
        <div className="flex items-center gap-4 relative">
          
          {/* Bildirim Zili */}
          <Link href="/todos" className="relative p-2 rounded-xl transition-all hover:bg-[var(--bg-surface-hover)]">
            <span className="text-xl">🔔</span>
            {dueTasks.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-bounce">
                {dueTasks.length}
              </span>
            )}
          </Link>

          {/* Tema Değiştirici Buton */}
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-[var(--bg-surface-hover)] hover:scale-110 active:scale-95"
            title={theme === 'dark' ? 'Light Mode Geç' : 'Dark Mode Geç'}
          >
            {theme === 'dark' ? (
              <span className="text-xl">🌞</span>
            ) : (
              <span className="text-xl">🌙</span>
            )}
          </button>

          <div 
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
            title={userEmail || ''}
          >
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          
          <button
            onClick={handleLogout}
            className="rounded-xl px-4 py-2 text-sm font-bold text-rose-500 transition-all hover:bg-rose-500/10 hover:shadow-[inset_0_0_10px_rgba(244,63,94,0.3)]"
          >
            Çıkış
          </button>
        </div>
      </header>
    </div>
  )
}
