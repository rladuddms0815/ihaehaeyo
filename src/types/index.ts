import type { ComponentType } from 'react'

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'xlarge'
  highContrast: boolean
  voiceSpeed: number
  screenReader: boolean
  simplifiedMode: boolean
}

export interface NotificationSettings {
  daily_reminder: boolean
  scam_alerts: boolean
  family_updates: boolean
}

export type DocumentType =
  | 'hospital'
  | 'prescription'
  | 'government'
  | 'banking'
  | 'scam'
  | 'app'
  | 'general'

export interface ScannedDocument {
  id: string
  imageUrl: string | null
  ocrText: string
  documentType: DocumentType
  title: string | null
  isScam: boolean
  scamRiskLevel: 'none' | 'low' | 'medium' | 'high'
  createdAt: string
}

export interface DocumentExplanation {
  id: string
  documentId: string
  simpleExplanation: string
  keyPoints: string[]
  actionItems: string[]
  warnings: string[]
  createdAt: string
}

export interface VoiceMessage {
  id: string
  sessionId: string
  documentId: string | null
  userMessage: string
  aiResponse: string
  isFollowUp: boolean
  createdAt: string
}

export interface FamilyCaregiver {
  id: string
  caregiverEmail: string
  caregiverName: string | null
  relationship: string | null
  status: 'pending' | 'accepted' | 'declined'
  canViewDocuments: boolean
  canViewConversations: boolean
  canReceiveAlerts: boolean
  invitedAt: string
  acceptedAt: string | null
}

export interface UserProfile {
  id: string
  userId: string
  nickname: string
  birthYear: number | null
  profileImageUrl: string | null
  accessibilitySettings: AccessibilitySettings
  notificationSettings: NotificationSettings
  createdAt: string
  updatedAt: string
}

export interface NavigationItem {
  path: string
  label: string
  icon: ComponentType<{ className?: string }>
  description: string
}
