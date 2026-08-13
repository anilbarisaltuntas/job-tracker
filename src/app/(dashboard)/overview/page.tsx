import Link from 'next/link'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import CompanyLogo from '@/components/ui/CompanyLogo'
import { createClient } from '@/lib/supabase/server'
import type { Application, TodoTask, UserStatus } from '@/lib/types'

export const metadata = {
  title: 'Genel Bakış - Başvuru Pusulası',
}

type OverviewApplication = Pick<
  Application,
  'id' | 'company_name' | 'company_domain' | 'position' | 'status' | 'created_at' | 'updated_at'
>

type OverviewTask = Pick<TodoTask, 'id' | 'title' | 'due_date' | 'priority' | 'application_id'> & {
  application: Pick<Application, 'company_name' | 'position'> | null
}

function startOfCurrentWeek() {
  const date = new Date()
  const day = date.getDay()
  const distanceToMonday = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - distanceToMonday)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatTaskDate(date: string | null) {
  if (!date) return 'Tarih belirlenmedi'
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function percentage(value: number, total: number) {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const weekStart = startOfCurrentWeek().toISOString()

  const [applicationsResult, statusesResult, tasksResult] = await Promise.all([
    supabase
      .from('applications')
      .select('id, company_name, company_domain, position, status, created_at, updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('user_statuses')
      .select('id, user_id, title, emoji, color, bg_color, order_index')
      .order('order_index', { ascending: true }),
    supabase
      .from('todo_tasks')
      .select('id, title, due_date, priority, application_id, application:applications(company_name, position)')
      .neq('status', 'completed')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(6),
  ])

  const applications = (applicationsResult.data || []) as OverviewApplication[]
  const statuses = (statusesResult.data || []) as UserStatus[]
  const tasks = (tasksResult.data || []) as unknown as OverviewTask[]
  const hasError = Boolean(applicationsResult.error || statusesResult.error || tasksResult.error)

  const thisWeekCount = applications.filter(application => application.created_at >= weekStart).length
  const updatedThisWeekCount = applications.filter(application => application.updated_at >= weekStart).length
  const recentApplications = applications.slice(0, 5)
  const statusCounts = new Map(statuses.map(status => [
    status.id,
    applications.filter(application => application.status === status.id).length,
  ]))
  const interviewStatus = statuses.find(status =>
    status.title.trim().toLocaleLowerCase('tr-TR') === 'mülakat yapıldı'
  ) ?? statuses.find(status => status.id === 'interview_done_waiting')
  const interviewCount = interviewStatus ? statusCounts.get(interviewStatus.id) || 0 : 0
  const interviewRate = percentage(interviewCount, applications.length)

  const metrics = [
    { label: 'Toplam başvuru', value: applications.length, detail: 'Panodaki tüm kayıtlar', icon: BriefcaseBusiness },
    { label: 'Bu hafta eklenen', value: thisWeekCount, detail: 'Pazartesiden bugüne', icon: CalendarDays },
    { label: 'Bu hafta güncellenen', value: updatedThisWeekCount, detail: 'Son işlem gören kayıtlar', icon: TrendingUp },
    { label: 'Mülakat oranı', value: `%${interviewRate}`, detail: `${interviewCount} başvuru · Mülakat Yapıldı`, icon: UserRoundCheck },
  ]

  return (
    <section className="mx-auto w-full max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-col gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">Günün özeti</p>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-3xl">Genel Bakış</h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--text-secondary)]">Başvuru sürecindeki hareketi ve sıradaki işleri tek ekranda gör.</p>
        </div>
        <Link href="/board" className="inline-flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-[var(--radius-md)] bg-[var(--accent)] px-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-colors hover:bg-[var(--accent-hover)] sm:self-auto">
          Panoya git
          <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </header>

      {hasError ? (
        <div className="mb-5 rounded-[10px] border border-[var(--danger)]/20 bg-[var(--danger-subtle)] px-4 py-3 text-sm font-medium text-[var(--danger)]" role="alert">
          Bazı özet verileri yüklenemedi. Sayfayı yenileyerek tekrar deneyebilirsin.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className={`relative min-h-36 p-5 ${index > 0 ? 'border-t border-[var(--border)]' : ''} ${index === 1 ? 'sm:border-l sm:border-t-0' : ''} ${index === 3 ? 'sm:border-l' : ''} ${index > 0 ? 'xl:border-l xl:border-t-0' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{metric.label}</p>
                  <Icon aria-hidden="true" size={17} className="text-[var(--text-tertiary)]" />
                </div>
                <p className="mt-5 text-4xl font-bold tracking-[-0.05em] text-[var(--text-primary)]">{metric.value}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{metric.detail}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <div className="space-y-6">
          <section className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">Başvuru akışı</h2>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Kayıtların pano aşamalarına dağılımı</p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-[var(--text-tertiary)]">{applications.length} kayıt</span>
            </div>
            <div className="space-y-4 p-5">
              {statuses.length > 0 ? statuses.map(status => {
                const count = statusCounts.get(status.id) || 0
                const rate = percentage(count, applications.length)
                return (
                  <div key={status.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(150px,0.8fr)_minmax(120px,1.2fr)_72px]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-sm" aria-hidden="true">{status.emoji}</span>
                      <span className="truncate text-xs font-semibold text-[var(--text-secondary)]">{status.title}</span>
                    </div>
                    <div className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-[var(--badge-bg)] sm:order-none sm:col-span-1">
                      <div className="h-full rounded-full transition-[width]" style={{ width: `${rate}%`, backgroundColor: status.color }} />
                    </div>
                    <span className="text-right text-xs font-bold tabular-nums text-[var(--text-primary)]">{count} · %{rate}</span>
                  </div>
                )
              }) : (
                <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">Henüz pano durumu bulunmuyor.</p>
              )}
            </div>
          </section>

          <section className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">Son güncellenenler</h2>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">En son hareket gören başvurular</p>
              </div>
              <Link href="/board" className="text-xs font-bold text-[var(--accent-strong)] hover:underline">Tümünü gör</Link>
            </div>
            <div className="divide-y divide-[var(--border)] px-5">
              {recentApplications.length > 0 ? recentApplications.map(application => {
                const status = statuses.find(item => item.id === application.status)
                return (
                  <Link key={application.id} href="/board" className="group flex min-h-[76px] items-center gap-3 py-3">
                    <CompanyLogo companyName={application.company_name} companyDomain={application.company_domain} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--text-primary)]">{application.company_name}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{application.position}</p>
                    </div>
                    <div className="hidden min-w-0 max-w-[42%] items-center gap-2 sm:flex">
                      <span className="truncate rounded-full bg-[var(--badge-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">{status?.emoji} {status?.title || 'Durum belirtilmedi'}</span>
                    </div>
                    <span className="hidden whitespace-nowrap text-[11px] font-medium text-[var(--text-tertiary)] md:block">{formatDistanceToNow(new Date(application.updated_at), { addSuffix: true, locale: tr })}</span>
                    <ArrowRight aria-hidden="true" size={15} className="shrink-0 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )
              }) : (
                <div className="flex min-h-40 flex-col items-center justify-center text-center">
                  <BriefcaseBusiness aria-hidden="true" size={20} className="text-[var(--text-tertiary)]" />
                  <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Henüz başvuru yok</p>
                  <Link href="/board" className="mt-2 text-xs font-bold text-[var(--accent-strong)]">İlk başvuruyu ekle</Link>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside>
          <section className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">Yaklaşan görevler</h2>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Açık görevlerinden sıradakiler</p>
              </div>
              <Link href="/todos" aria-label="Tüm görevleri aç" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><ArrowRight aria-hidden="true" size={17} /></Link>
            </div>
            <div className="p-3">
              {tasks.length > 0 ? (
                <div className="space-y-1">
                  {tasks.map(task => (
                    <Link key={task.id} href="/todos" className="group flex items-start gap-3 rounded-[9px] px-2 py-3 transition-colors hover:bg-[var(--bg-surface-hover)]">
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border ${task.priority === 'high' ? 'border-rose-500/20 bg-rose-500/10 text-rose-500' : 'border-[var(--border)] bg-[var(--bg-column)] text-[var(--text-tertiary)]'}`}>
                        <Clock3 aria-hidden="true" size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--text-primary)]">{task.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-tertiary)]">
                          <span>{formatTaskDate(task.due_date)}</span>
                          {task.application?.company_name ? <><span aria-hidden="true">·</span><span className="truncate">{task.application.company_name}</span></> : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-44 flex-col items-center justify-center px-4 text-center">
                  <CheckCircle2 aria-hidden="true" size={21} className="text-emerald-500" />
                  <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Açık görev yok</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">Sıradaki adımlarını görev olarak ekleyebilirsin.</p>
                </div>
              )}
            </div>
            <div className="border-t border-[var(--border)] p-3">
              <Link href="/todos" className="flex h-9 items-center justify-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]">
                <Plus aria-hidden="true" size={14} />
                Görevleri yönet
              </Link>
            </div>
          </section>

        </aside>
      </div>
    </section>
  )
}
