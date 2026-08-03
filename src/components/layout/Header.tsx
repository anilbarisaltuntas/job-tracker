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
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-header)] glass-header border-b border-[var(--border)] transition-colors duration-300">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-6">
        {/* Sol: Logo ve Navigasyon */}
        <div className="flex items-center gap-8">
          <Link href="/board" className="flex items-center gap-2.5 group">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:scale-105"
              style={{ background: 'var(--logo-bg)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
            <h1 className="text-[15px] font-bold tracking-tight hidden sm:block" style={{ color: 'var(--text-primary)' }}>
              Başvuru Pusulası
            </h1>
          </Link>

          <nav className="flex items-center gap-1.5 rounded-xl bg-[var(--bg-column)] p-1 border border-[var(--border)]">
            {[
              { href: '/board', label: 'Pano', emoji: '📋' },
              { href: '/todos', label: 'Görevler', emoji: '✅' },
              { href: '/saved', label: 'Kaydedilenler', emoji: '📌' },
              { href: '/settings', label: 'Ayarlar', emoji: '⚙️' },
            ].map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--bg-surface)] text-[var(--accent)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sağ: Bildirimler + Tema + Kullanıcı bilgisi + Çıkış */}
        <div className="flex items-center gap-4 relative">
          
          {/* Bildirim Zili */}
          <Link href="/todos" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {dueTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
                {dueTasks.length}
              </span>
            )}
          </Link>

          {/* Tema Değiştirici Buton */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
            title={theme === 'dark' ? 'Light Mode Geç' : 'Dark Mode Geç'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          <div className="h-4 w-[1px] bg-[var(--border)]" />

          {/* Kullanıcı Bilgisi */}
          <div className="flex items-center gap-2.5">
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/30 text-[12px] font-bold text-[var(--accent)] shadow-xs"
              title={userEmail || ''}
            >
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <button
              onClick={handleLogout}
              className="text-[13px] font-medium text-[var(--text-tertiary)] hover:text-rose-500 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
