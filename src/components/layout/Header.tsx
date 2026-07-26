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
  const [dueTasks, setDueTasks] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        
        // Vakti gelmiş görevleri (hatırlatıcıları) kontrol et
        const checkNotifications = async () => {
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
              // Yeni bildirimler varsa tarayıcı bildirimi (Push) gönder
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
        
        // Tarayıcı bildirimi izni iste
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission()
          }
        }
        
        checkNotifications()
        const interval = setInterval(checkNotifications, 60000) // Her dakika kontrol et
        return () => clearInterval(interval)
      }
    }
    const cleanup = init()
    return () => {
      cleanup.then(cleanFn => { if (cleanFn) cleanFn() })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkAsCompleted = async (taskId: string) => {
    await supabase.from('todo_tasks').update({ status: 'completed' }).eq('id', taskId)
    setDueTasks(prev => prev.filter(t => t.id !== taskId))
  }

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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" style={{ color: 'var(--logo-text)' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
            <h1
              className="text-base font-semibold tracking-tight hidden sm:block"
              style={{ color: 'var(--text-primary)' }}
            >
              Başvuru Pusulası
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

        {/* Sağ: Bildirimler + Tema + Kullanıcı bilgisi + Çıkış */}
        <div className="flex items-center gap-3 relative">
          
          {/* Bildirim Zili */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }}
              title="Hatırlatıcılar"
            >
              🔔
              {dueTasks.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {dueTasks.length}
                </span>
              )}
            </button>

            {/* Bildirim Dropdown */}
            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg p-2"
                style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="mb-2 px-2 pt-2 pb-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Hatırlatıcılar
                </div>
                {dueTasks.length === 0 ? (
                  <div className="p-3 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                    Yaklaşan bir hatırlatıcınız yok.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {dueTasks.map(task => (
                      <div key={task.id} className="p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                            {task.application?.company_name && (
                              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>🏢 {task.application.company_name}</p>
                            )}
                            <p className="text-[10px] mt-0.5 text-red-500">
                              Vakti Geldi: {new Date(task.due_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleMarkAsCompleted(task.id)}
                            className="text-[10px] bg-green-500/10 text-green-600 px-2 py-1 rounded hover:bg-green-500 hover:text-white transition-colors"
                            title="Tamamlandı"
                          >
                            ✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

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
