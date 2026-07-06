import { useState } from 'react'
import { useNavigate, type Route } from '../lib/router'
import { Camera, Mic, FileText, Users, Settings, HelpCircle, Shield, Clock, AlertTriangle } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'
import { useSession } from '../lib/session-context'

// Shared localStorage contract with ExplanationPage.tsx / DocumentsPage.tsx.
// All three pages read/write this same key and shape.
const DOCUMENTS_STORAGE_KEY = 'ihaehaeyo_saved_documents'

interface AIExplanation {
  simpleExplanation: string
  keyPoints: string[]
  actionItems: string[]
  warnings: string[]
}

interface SavedDocument {
  id: string
  title: string
  type: string
  createdAt: string
  isScam: boolean
  imageUrl?: string
  ocrText: string
  scamRiskLevel?: 'none' | 'low' | 'medium' | 'high'
  confidence?: number
  aiExplanation: AIExplanation
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  hospital: '병원',
  prescription: '약',
  banking: '은행',
  government: '정부',
  scam: '사기 의심',
  app: '앱',
  general: '문서',
}

function loadSavedDocuments(): SavedDocument[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('[Dashboard] 최근 문서를 불러오지 못했습니다:', err)
    return []
  }
}

function formatAnalyzedAt(dateStr: string) {
  const date = new Date(dateStr)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hours}:${minutes}`
}

const mainActions = [
  {
    icon: Camera,
    label: '사진 찍기',
    description: '문서나 이미지를 찍어보세요',
    path: '/scan',
    color: 'from-primary-500 to-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    icon: Mic,
    label: '음성으로 물어보기',
    description: '말씀하시면 AI가 답해드려요',
    path: '/voice',
    color: 'from-secondary-500 to-secondary-600',
    bgColor: 'bg-secondary-50',
  },
  {
    icon: FileText,
    label: '내 문서 보기',
    description: '설명받은 문서들을 보세요',
    path: '/documents',
    color: 'from-accent-500 to-accent-600',
    bgColor: 'bg-accent-50',
  },
  {
    icon: Shield,
    label: '사기 신고/확인',
    description: '의심되는 내용을 확인하세요',
    path: '/scam-check',
    color: 'from-danger-500 to-danger-600',
    bgColor: 'bg-danger-50',
  },
] as const

const quickLinks = [
  { icon: Users, label: '가족 공유', path: '/family' },
  { icon: Settings, label: '설정', path: '/settings' },
  { icon: HelpCircle, label: '도움말', path: '/help' },
] as const

// Rotates once per day (based on day-of-month), not on every refresh.
const safetyTips = [
  '중요한 계약서나 안내문은 가족과 함께 확인하면 더욱 안전합니다.',
  '모르는 번호의 송금 요구는 가족에게 먼저 확인하세요.',
  '약은 설명서를 읽고 정해진 시간에 복용하세요.',
  '개인정보와 인증번호는 다른 사람에게 알려주지 마세요.',
  '출처를 알 수 없는 링크는 누르지 말고 가족에게 먼저 물어보세요.',
  '전화로 정부기관을 사칭하며 돈을 요구하면 대부분 사기입니다.',
  '가족이나 지인이라며 급하게 돈을 요구하면 먼저 전화로 확인하세요.',
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { announce } = useAccessibility()
  const { profile } = useSession()
  const [recentDocuments] = useState<SavedDocument[]>(() => loadSavedDocuments().slice(0, 3))

  const handleAction = (path: Route, label: string) => {
    announce(`${label} 화면으로 이동합니다.`)
    navigate(path)
  }

  const handleOpenRecentDocument = (doc: SavedDocument) => {
    announce(`${doc.title} 분석 결과를 엽니다.`)
    navigate('/explanation', {
      imageUrl: doc.imageUrl,
      ocrText: doc.ocrText,
      documentType: doc.type,
      isScam: doc.isScam,
      scamRiskLevel: doc.scamRiskLevel,
      confidence: doc.confidence,
      aiExplanation: doc.aiExplanation,
      // Marks this as an already-saved document so ExplanationPage skips the
      // "save this document?" prompt.
      savedDocumentId: doc.id,
    })
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? '좋은 아침입니다' : today.getHours() < 18 ? '좋은 오후입니다' : '좋은 저녁입니다'
  const todaySafetyTip = safetyTips[today.getDate() % safetyTips.length]

  return (
    <div className="min-h-screen bg-[#FFF8EF]">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="page-container py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-primary-600 mb-1">
                AI 문서 도우미
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">이해해요</h1>
              <p className="text-sm sm:text-base text-neutral-500">
                어려운 문서를 쉽게 설명해드려요
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {quickLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => {
                    announce(`${link.label} 화면으로 이동합니다.`)
                    navigate(link.path)
                  }}
                  className="w-12 h-12 sm:w-12 rounded-xl bg-white hover:bg-neutral-100 flex items-center justify-center transition-colors shadow-sm"
                  aria-label={link.label}
                >
                  <link.icon className="w-6 h-6 text-neutral-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="page-container py-6 lg:py-8">
        {/* Welcome Card */}
        <section className="mb-8 rounded-elder-lg bg-gradient-to-br from-primary-500 to-primary-600 p-6 lg:p-8 shadow-lg text-white animate-fade-in">
          <p className="text-elder-base lg:text-elder-lg font-bold mb-2">
            👋 오늘도 AI가 도와드릴게요
          </p>
          <h2 className="text-elder-2xl lg:text-elder-3xl font-bold mb-3">
            {greeting}, {profile?.name || '사용자'}님
          </h2>
          <p className="text-elder-base text-primary-50">
            사진을 찍거나 음성으로 질문해보세요.
          </p>
        </section>

        {/* Main Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-7 mb-10">
          {mainActions.map((action, index) => (
            <button
              key={action.path}
              onClick={() => handleAction(action.path, action.label)}
              className={`card-elder p-6 lg:p-7 text-center flex flex-col items-center hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 animate-fade-in group`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                <action.icon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-elder-lg lg:text-elder-xl font-bold text-neutral-900 mb-1">
                {action.label}
              </h3>
              <p className="text-elder-sm lg:text-elder-base text-neutral-600">
                {action.description}
              </p>
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-elder-lg font-bold text-neutral-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-neutral-500" />
              최근에 확인한 것
            </h3>
            <button
              onClick={() => navigate('/documents')}
              className="text-elder-base text-primary-600 hover:text-primary-700 font-medium"
            >
              전체 보기
            </button>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="card-elder p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-elder-base text-neutral-500">
                  아직 확인한 문서가 없습니다<br />
                </p>
                <p className="text-elder-sm text-neutral-400 mt-1">
                  사진을 찍어 무슨 내용인지 알아보세요
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleOpenRecentDocument(doc)}
                  className="card-elder p-5 w-full flex items-center gap-4 text-left hover:shadow-lg transition-shadow"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    doc.isScam ? 'bg-danger-100' : 'bg-primary-100'
                  }`}>
                    {doc.isScam ? (
                      <AlertTriangle className="w-7 h-7 text-danger-600" />
                    ) : (
                      <FileText className="w-7 h-7 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-elder-base font-bold text-neutral-900 mb-1 truncate">
                      {doc.title}
                    </h4>
                    <div className="flex items-center gap-3 text-elder-sm text-neutral-500">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 shrink-0">
                        {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-4 h-4" />
                        {formatAnalyzedAt(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Daily Safety Tip */}
        <section className="card-elder border-2 border-primary-200 bg-gradient-to-br from-white to-primary-50 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-elder-lg font-bold text-neutral-900 mb-2">
                💡 오늘의 안전 정보
              </h4>
              <p className="text-elder-base text-neutral-600">
                {todaySafetyTip}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
