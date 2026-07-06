import { useState } from 'react'
import { useRouter } from '../lib/router'
import { X, FileText, Camera, Trash2, Calendar, AlertTriangle } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'

interface AIExplanation {
  simpleExplanation: string
  keyPoints: string[]
  actionItems: string[]
  warnings: string[]
}

// Shared localStorage contract with ExplanationPage.tsx. Both pages read/write
// this same key and shape.
const DOCUMENTS_STORAGE_KEY = 'ihaehaeyo_saved_documents'

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

function loadSavedDocuments(): SavedDocument[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('[DocumentsPage] 저장된 문서를 불러오지 못했습니다:', err)
    return []
  }
}

function persistSavedDocuments(documents: SavedDocument[]) {
  try {
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents))
  } catch (err) {
    console.error('[DocumentsPage] 문서를 저장하지 못했습니다:', err)
  }
}

const filterTypes = [
  { id: 'all', label: '전체', icon: FileText },
  { id: 'hospital', label: '병원', icon: FileText },
  { id: 'prescription', label: '약', icon: FileText },
  { id: 'banking', label: '은행', icon: FileText },
  { id: 'government', label: '정부', icon: FileText },
  { id: 'scam', label: '사기', icon: FileText },
  { id: 'app', label: '앱', icon: FileText },
  { id: 'general', label: '기타', icon: FileText },
]

export default function DocumentsPage() {
  const { navigate, goBack } = useRouter()
  const { announce } = useAccessibility()

  const [documents, setDocuments] = useState<SavedDocument[]>(() => loadSavedDocuments())
  const [filter, setFilter] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const filteredDocuments = filter === 'all'
    ? documents
    : documents.filter(doc => doc.type === filter)

  const handleDelete = (id: string) => {
    const updated = documents.filter(doc => doc.id !== id)
    setDocuments(updated)
    persistSavedDocuments(updated)
    setShowDeleteConfirm(null)
    announce('문서를 삭제했습니다.')
  }

  const handleOpenDocument = (doc: SavedDocument) => {
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  const getTypeLabel = (type: string) => {
    return filterTypes.find(t => t.id === type)?.label || type
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className="page-container py-4 flex items-center justify-between">
          <button
            onClick={() => goBack()}
            className="w-12 h-12 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
            aria-label="뒤로 가기"
          >
            <X className="w-6 h-6 text-neutral-600" />
          </button>
          <h1 className="text-lg font-bold text-neutral-800">내 문서</h1>
          <button
            onClick={() => navigate('/scan')}
            className="w-12 h-12 rounded-xl bg-primary-100 hover:bg-primary-200 flex items-center justify-center transition-colors"
            aria-label="새 문서 스캔"
          >
            <Camera className="w-6 h-6 text-primary-600" />
          </button>
        </div>
      </header>

      <main className="pt-20 pb-8">
        <div className="page-container py-6">
          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-6">
            {filterTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setFilter(type.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-3 rounded-full font-medium transition-colors ${
                  filter === type.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <type.icon className="w-5 h-5" />
                <span className="text-elder-base">{type.label}</span>
              </button>
            ))}
          </div>

          {/* Documents List */}
          {documents.length === 0 ? (
            <div className="card-elder p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-elder-base text-neutral-600 mb-1">
                아직 저장된 문서가 없습니다.
              </p>
              <p className="text-elder-base text-neutral-600 mb-4">
                아래 버튼을 눌러 첫 문서를 촬영해보세요.
              </p>
              <button
                onClick={() => navigate('/scan')}
                className="btn-elder-primary"
              >
                <Camera className="w-6 h-6" />
                <span>사진 찍기</span>
              </button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="card-elder p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-elder-base text-neutral-600 mb-4">
                {getTypeLabel(filter)} 문서가 없습니다
              </p>
              <button
                onClick={() => navigate('/scan')}
                className="btn-elder-primary"
              >
                <Camera className="w-6 h-6" />
                <span>사진 찍기</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="card-elder p-5">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => handleOpenDocument(doc)}
                      className="flex items-start gap-4 text-left flex-1"
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
                      <div>
                        <h3 className="text-elder-lg font-bold text-neutral-900 mb-1">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-3 text-elder-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(doc.createdAt)}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-neutral-100">
                            {getTypeLabel(doc.type)}
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowDeleteConfirm(doc.id)}
                      className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-danger-100 flex items-center justify-center transition-colors group"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-5 h-5 text-neutral-400 group-hover:text-danger-600" />
                    </button>
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteConfirm === doc.id && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <p className="text-elder-base text-neutral-600 mb-3">
                        이 문서를 삭제하시겠어요?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="btn-elder-secondary flex-1"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="btn-elder-danger flex-1"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {documents.length > 0 && (
            <div className="mt-8 p-5 bg-neutral-100 rounded-elder">
              <div className="flex items-center justify-between text-elder-base">
                <span className="text-neutral-500">전체 문서</span>
                <span className="font-bold text-neutral-900">{documents.length}개</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
