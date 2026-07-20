'use client'

/**
 * KANBAN BOARD — Ana Board Bileşeni
 * 
 * Bu bileşen tüm Kanban mantığını yönetir:
 * 1. Supabase'den başvuruları çeker
 * 2. Sütunlara dağıtır
 * 3. Sürükle-bırak ile durum değişikliğini yönetir
 * 4. CRUD modal'larını kontrol eder
 * 
 * STATE YÖNETİMİ:
 * - applications: tüm başvuru listesi
 * - selectedApp: detay/düzenleme için seçilen başvuru
 * - isFormOpen: yeni başvuru modal'ı açık mı?
 * - defaultStatus: yeni başvuru hangi sütuna eklenecek?
 */

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { createClient } from '@/lib/supabase/client'
import { Application, ApplicationStatus } from '@/lib/types'
import { KANBAN_COLUMNS } from '@/lib/constants'
import KanbanColumn from './KanbanColumn'
import ApplicationForm from '../applications/ApplicationForm'
import ApplicationDetail from '../applications/ApplicationDetail'
import TableView from './TableView'

export default function KanbanBoard() {
  // ===== STATE (Durum Değişkenleri) =====
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)           // Yeni başvuru formu açık mı?
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)  // Detay görüntüleme
  const [editingApp, setEditingApp] = useState<Application | null>(null)    // Düzenleme
  const [defaultStatus, setDefaultStatus] = useState<ApplicationStatus>('applied_message_pending')

  // Filtreleme State'leri
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOverdue, setFilterOverdue] = useState(false)

  const supabase = createClient()

  // ===== VERİ ÇEKME =====
  /**
   * useCallback → Bu fonksiyonu "ezberler", her render'da yeniden oluşturmaz.
   * Bu önemli çünkü useEffect içinde kullanıyoruz.
   */
  const fetchApplications = useCallback(async () => {
    // contacts(*) → her başvurunun iletişim kişilerini de getir (JOIN)
    const { data, error } = await supabase
      .from('applications')
      .select('*, contacts(*)')
      .order('kanban_order', { ascending: true })

    if (error) {
      console.error('Başvurular yüklenirken hata:', error)
    } else {
      setApplications(data || [])
    }
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * useEffect → Bileşen ilk yüklendiğinde çalışır.
   * Boş dizi [] → "sadece bir kere çalış" demek.
   * Sayfa her render olduğunda değil, ilk açıldığında veri çeker.
   */
  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // ===== SÜRÜKLE-BIRAK =====
  /**
   * Kullanıcı bir kartı sürükleyip bıraktığında çalışır.
   * 
   * result objesi şunları içerir:
   * - source: kartın NEREDEN geldiği (sütun + index)
   * - destination: kartın NEREYE bırakıldığı (sütun + index)
   * - draggableId: sürüklenen kartın ID'si
   */
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    // Geçerli bir yere bırakılmadıysa hiçbir şey yapma
    if (!destination) return

    // Aynı yere bırakıldıysa hiçbir şey yapma
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return

    // ===== İYİMSER GÜNCELLEME (Optimistic Update) =====
    // Önce UI'ı anında güncelle, sonra veritabanını güncelle.
    // Böylece kullanıcı "gecikmesiz" bir deneyim yaşar.
    // Hata olursa geri alırız.

    const updatedApps = [...applications]
    const movedApp = updatedApps.find(app => app.id === draggableId)
    if (!movedApp) return

    // Eski durumu kaydet (hata olursa geri almak için)
    const oldStatus = movedApp.status
    const oldOrder = movedApp.kanban_order

    // Yeni durumu ve sırayı ayarla
    movedApp.status = destination.droppableId as ApplicationStatus
    movedApp.kanban_order = destination.index

    // UI'ı anında güncelle
    setApplications(updatedApps)

    // Veritabanını güncelle
    const { error } = await supabase
      .from('applications')
      .update({
        status: destination.droppableId,
        kanban_order: destination.index,
      })
      .eq('id', draggableId)

    if (error) {
      console.error('Durum güncellenirken hata:', error)
      // Hata olursa eski duruma geri dön
      movedApp.status = oldStatus
      movedApp.kanban_order = oldOrder
      setApplications([...updatedApps])
    }
  }

  // ===== CRUD İŞLEMLERİ =====
  const handleAddClick = (status: ApplicationStatus) => {
    setDefaultStatus(status)
    setEditingApp(null)
    setIsFormOpen(true)
  }

  const handleCardClick = (app: Application) => {
    setSelectedApp(app)
  }

  const handleEdit = (app: Application) => {
    setSelectedApp(null)
    setEditingApp(app)
    setIsFormOpen(true)
  }

  const handleDelete = async (appId: string) => {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', appId)

    if (!error) {
      setApplications(prev => prev.filter(app => app.id !== appId))
      setSelectedApp(null)
    }
  }

  const handleBulkDelete = async (appIds: string[]) => {
    const { error } = await supabase
      .from('applications')
      .delete()
      .in('id', appIds)

    if (!error) {
      setApplications(prev => prev.filter(app => !appIds.includes(app.id)))
      setSelectedApp(null)
    }
  }

  const handleBulkStatusUpdate = async (appIds: string[], newStatus: ApplicationStatus) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .in('id', appIds)

    if (!error) {
      setApplications(prev => prev.map(app => 
        appIds.includes(app.id) ? { ...app, status: newStatus } : app
      ))
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingApp(null)
    fetchApplications() // Listeyi yenile
  }

  // ===== FİLTRELEME MANTIĞI =====
  const filteredApplications = applications.filter(app => {
    const search = searchQuery.toLocaleLowerCase('tr-TR')
    const matchesSearch = 
      app.company_name.toLocaleLowerCase('tr-TR').includes(search) ||
      app.position.toLocaleLowerCase('tr-TR').includes(search)
    
    const isOverdue = app.follow_up_date && new Date(app.follow_up_date) < new Date()
    const matchesOverdue = filterOverdue ? isOverdue : true

    return matchesSearch && matchesOverdue
  })

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3" style={{ color: 'var(--text-tertiary)' }}>
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Başvurular yükleniyor...
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Arama ve Filtreleme Çubuğu */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Şirket veya pozisyon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Görünüm Değiştirici */}
          <div className="flex items-center rounded-xl p-1" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-blue-500/10 text-blue-500' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              style={viewMode === 'kanban' ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: 'var(--text-tertiary)' }}
            >
              📋 Pano
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-blue-500/10 text-blue-500' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              style={viewMode === 'table' ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: 'var(--text-tertiary)' }}
            >
              🗂️ Liste
            </button>
          </div>

          <button
            onClick={() => setFilterOverdue(!filterOverdue)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              filterOverdue 
                ? 'border-red-500 bg-red-500/10 text-red-500' 
                : 'opacity-80 hover:opacity-100'
            }`}
            style={!filterOverdue ? {
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            } : { border: '1px solid currentColor' }}
          >
            {filterOverdue ? '⚠️ Sadece Gecikenler Açık' : '🔔 Gecikenleri Göster'}
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-6 pb-8 sm:grid-cols-2 xl:grid-cols-4">
            {KANBAN_COLUMNS.map(column => {
              // Bu sütuna ait başvuruları filtrele
              const columnApps = filteredApplications
                .filter(app => app.status === column.id)
                .sort((a, b) => a.kanban_order - b.kanban_order)

              return (
                <KanbanColumn
                  key={column.id}
                  columnId={column.id}
                  title={column.title}
                  emoji={column.emoji}
                  color={column.color}
                  bgColor={column.bgColor}
                  applications={columnApps}
                  onCardClick={handleCardClick}
                  onAddClick={() => handleAddClick(column.id)}
                />
              )
            })}
          </div>
        </DragDropContext>
      ) : (
        <div className="pb-8">
          <TableView
            applications={filteredApplications}
            onCardClick={handleCardClick}
            onBulkDelete={handleBulkDelete}
            onBulkStatusUpdate={handleBulkStatusUpdate}
          />
        </div>
      )}

      {/* Yeni Başvuru / Düzenleme Modal */}
      {isFormOpen && (
        <ApplicationForm
          editingApplication={editingApp}
          defaultStatus={defaultStatus}
          onClose={() => { setIsFormOpen(false); setEditingApp(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Başvuru Detay Modal */}
      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
