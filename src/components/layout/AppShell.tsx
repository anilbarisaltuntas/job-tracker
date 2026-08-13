'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import {
  Bookmark,
  CheckSquare2,
  Compass,
  KanbanSquare,
  LogOut,
  Moon,
  Settings2,
  Sun,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/context/ThemeContext'

interface AppShellProps {
  children: React.ReactNode
  userEmail: string | null
}

type Theme = 'dark' | 'light'

const navigation = [
  { href: '/board', label: 'Pano', icon: KanbanSquare },
  { href: '/todos', label: 'Görevler', icon: CheckSquare2 },
  { href: '/saved', label: 'Kaydedilenler', icon: Bookmark },
  { href: '/settings', label: 'Ayarlar', icon: Settings2 },
]

const pageInfo: Record<string, { title: string; eyebrow: string }> = {
  '/board': { title: 'Takip Panosu', eyebrow: 'Başvurular' },
  '/todos': { title: 'Görevler', eyebrow: 'Ajanda' },
  '/saved': { title: 'Kaydedilenler', eyebrow: 'İlan Havuzu' },
  '/settings': { title: 'Ayarlar', eyebrow: 'Çalışma Alanı' },
}

function Brand({ showName = false }: { showName?: boolean }) {
  return (
    <Link
      href="/board"
      className="group flex items-center gap-2.5 focus-visible:outline-none"
      aria-label="Başvuru Pusulası ana sayfa"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--brand-solid)] text-[var(--brand-on-solid)]">
        <Compass aria-hidden="true" size={19} strokeWidth={2.1} />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--nav-bg)] bg-[var(--signal)]" />
      </span>
      {showName && (
        <span className="text-sm font-bold tracking-[-0.03em] text-[var(--text-primary)]">
          Başvuru Pusulası
        </span>
      )}
    </Link>
  )
}

function ThemeSelector({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-[9px] border border-[var(--border)] bg-[var(--bg)] p-1" aria-label="Tema seçimi">
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        className={`flex h-9 items-center justify-center gap-2 rounded-[6px] text-xs font-semibold transition-colors ${
          theme === 'light'
            ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
        }`}
      >
        <Sun aria-hidden="true" size={15} />
        Açık
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={`flex h-9 items-center justify-center gap-2 rounded-[6px] text-xs font-semibold transition-colors ${
          theme === 'dark'
            ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
        }`}
      >
        <Moon aria-hidden="true" size={15} />
        Koyu
      </button>
    </div>
  )
}

interface AccountMenuProps {
  align?: 'side' | 'bottom'
  labeled?: boolean
  theme: Theme
  setTheme: (theme: Theme) => void
  userEmail: string | null
  userInitial: string
  onLogout: () => void
}

function AccountMenu({ align = 'bottom', labeled = false, theme, setTheme, userEmail, userInitial, onLogout }: AccountMenuProps) {
  return (
    <details className="group/account relative">
      <summary
        className={`cursor-pointer list-none text-[var(--nav-text)] transition-colors hover:bg-[var(--nav-item-hover)] hover:text-[var(--nav-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)] ${
          labeled
            ? 'flex h-[58px] w-[72px] flex-col items-center justify-center gap-1 rounded-[10px]'
            : 'flex h-10 w-10 items-center justify-center rounded-full border border-[var(--nav-border)] bg-[var(--nav-item)]'
        }`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--nav-border)] bg-[var(--nav-item)] text-[11px] font-bold text-[var(--nav-text-strong)]" aria-hidden="true">
          {userInitial}
        </span>
        {labeled && <span className="text-[10px] font-semibold leading-none">Hesap</span>}
        <span className="sr-only">Kullanıcı menüsü</span>
      </summary>
      <div
        className={`absolute z-50 w-72 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow-lg)] ${
          align === 'side' ? 'bottom-0 left-[calc(100%+14px)]' : 'right-0 top-[calc(100%+10px)]'
        }`}
      >
        <div className="mb-3 border-b border-[var(--border)] px-1 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Hesap</p>
          <p className="mt-1 truncate text-sm font-medium text-[var(--text-primary)]">{userEmail || 'Kullanıcı'}</p>
        </div>
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Görünüm</p>
        <ThemeSelector theme={theme} setTheme={setTheme} />
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 flex h-10 w-full items-center gap-2 rounded-[8px] px-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--danger-subtle)] hover:text-[var(--danger)]"
        >
          <LogOut aria-hidden="true" size={16} />
          Çıkış yap
        </button>
      </div>
    </details>
  )
}

export default function AppShell({ children, userEmail }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { theme, setTheme, toggleTheme } = useTheme()
  const currentPage = pageInfo[pathname] ?? { title: 'Başvuru Pusulası', eyebrow: 'Çalışma Alanı' }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userInitial = userEmail?.charAt(0).toLocaleUpperCase('tr-TR') || 'U'

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <a
        href="#ana-icerik"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-[8px] bg-[var(--signal)] px-4 py-2 text-sm font-bold text-[var(--signal-contrast)] transition-transform focus:translate-y-0"
      >
        Ana içeriğe geç
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[92px] flex-col items-center border-r border-[var(--nav-border)] bg-[var(--nav-bg)] py-4 lg:flex">
        <Brand />

        <nav className="mt-8 flex w-full flex-1 flex-col gap-1 px-2.5" aria-label="Ana navigasyon">
          {navigation.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex h-[58px] w-full flex-col items-center justify-center gap-1.5 rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)] ${
                  isActive
                    ? 'bg-[var(--nav-active)] text-[var(--nav-text-strong)]'
                    : 'text-[var(--nav-text)] hover:bg-[var(--nav-item-hover)] hover:text-[var(--nav-text-strong)]'
                }`}
              >
                {isActive && <span className="absolute -left-2.5 h-7 w-[3px] rounded-r-full bg-[var(--signal)]" />}
                <Icon aria-hidden="true" size={21} strokeWidth={isActive ? 2.25 : 1.8} />
                <span className="text-[11px] font-semibold leading-none">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-col items-center gap-1 px-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            className="flex h-[58px] w-[72px] flex-col items-center justify-center gap-1.5 rounded-[10px] text-[var(--nav-text)] transition-colors hover:bg-[var(--nav-item-hover)] hover:text-[var(--nav-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)]"
          >
            {theme === 'dark' ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
            <span className="text-[10px] font-semibold leading-none">Tema</span>
          </button>
          <AccountMenu
            align="side"
            labeled
            theme={theme}
            setTheme={setTheme}
            userEmail={userEmail}
            userInitial={userInitial}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      <div className="lg:pl-[92px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[var(--border)] bg-[var(--bg-header)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="min-w-0 border-l border-[var(--border)] pl-3 lg:border-l-0 lg:pl-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{currentPage.eyebrow}</p>
              <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">{currentPage.title}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="lg:hidden">
              <AccountMenu
                theme={theme}
                setTheme={setTheme}
                userEmail={userEmail}
                userInitial={userInitial}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        <main id="ana-icerik" className="min-h-[calc(100dvh-68px)] pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
      </div>

      <nav
        className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 grid w-[calc(100%-24px)] max-w-md -translate-x-1/2 grid-cols-4 rounded-[14px] border border-[var(--nav-border)] bg-[var(--nav-bg)] p-1.5 shadow-[var(--shadow-lg)] lg:hidden"
        aria-label="Mobil navigasyon"
      >
        {navigation.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)] ${
                isActive ? 'bg-[var(--nav-active)] text-[var(--nav-text-strong)]' : 'text-[var(--nav-text)]'
              }`}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={isActive ? 2.25 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
