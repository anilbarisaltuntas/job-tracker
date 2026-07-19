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

export default function KanbanBoard() {
  // ===== STATE (Durum Değişkenleri) =====
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)           // Yeni başvuru formu açık mı?
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)  // Detay görüntüleme
  const [editingApp, setEditingApp] = useState<Application | null>(null)    // Düzenleme
  const [defaultStatus, setDefaultStatus] = useState<ApplicationStatus>('applied_message_pending')

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

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingApp(null)
    fetchApplications() // Listeyi yenile
  }

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
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
      {/*
        DRAG DROP CONTEXT
        Sürükle-bırak alanının tamamını sarar.
        onDragEnd → kart bırakıldığında ne yapılacağını belirler.
      */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(column => {
            // Bu sütuna ait başvuruları filtrele
            const columnApps = applications
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
