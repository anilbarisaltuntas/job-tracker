import type { OpportunityFormat, OpportunityStatus, OpportunityType } from '@/lib/types'

export const OPPORTUNITY_STATUSES: Array<{
  id: OpportunityStatus
  title: string
  color: string
}> = [
  { id: 'to_apply', title: 'Başvurulacak', color: '#3B82F6' },
  { id: 'applied', title: 'Başvuruldu', color: '#8B5CF6' },
  { id: 'accepted', title: 'Kabul Edildi', color: '#10B981' },
  { id: 'rejected', title: 'Reddedildi', color: '#F43F5E' },
]

export const OPPORTUNITY_TYPES: Array<{ value: OpportunityType; label: string }> = [
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'volunteer_project', label: 'Gönüllü Proje' },
  { value: 'networking_event', label: 'Network Etkinliği' },
  { value: 'workshop_seminar', label: 'Workshop / Seminer' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'mentorship_fellowship', label: 'Mentorluk / Fellowship' },
  { value: 'education_program', label: 'Eğitim Programı' },
  { value: 'other', label: 'Diğer' },
]

export const OPPORTUNITY_FORMATS: Array<{ value: OpportunityFormat; label: string }> = [
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'Yüz yüze' },
  { value: 'hybrid', label: 'Hibrit' },
]

export function getOpportunityTypeLabel(type: OpportunityType) {
  return OPPORTUNITY_TYPES.find(option => option.value === type)?.label ?? 'Diğer'
}

export function getOpportunityFormatLabel(format: OpportunityFormat) {
  return OPPORTUNITY_FORMATS.find(option => option.value === format)?.label ?? format
}
