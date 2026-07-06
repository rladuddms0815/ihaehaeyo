import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from '../lib/router'
import { X, FileText, Play, Pause, CheckCircle, AlertTriangle, AlertCircle, ArrowRight, MessageCircle, Share2 } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'
import { useVoice } from '../lib/voice-context'

interface AIExplanation {
  simpleExplanation: string
  keyPoints: string[]
  actionItems: string[]
  warnings: string[]
}

interface ExplanationState {
  imageUrl?: string
  ocrText: string
  documentType: string
  isScam?: boolean
  scamRiskLevel?: 'none' | 'low' | 'medium' | 'high'
  confidence?: number
  aiExplanation?: AIExplanation
  // Present when this page was opened by tapping a document that's already
  // saved (from DocumentsPage). Used to skip the "save this document?" prompt
  // for documents that are already stored.
  savedDocumentId?: string
}

// Shared localStorage contract with DocumentsPage.tsx. Both pages read/write
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

const DOCUMENT_TYPE_TITLES: Record<string, string> = {
  hospital: '병원 문서',
  prescription: '약 처방전',
  government: '정부 안내문',
  banking: '은행 문서',
  scam: '사기 의심',
  app: '앱 화면',
  general: '기타 문서',
}

function generateDocumentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function loadSavedDocuments(): SavedDocument[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('[ExplanationPage] 저장된 문서를 불러오지 못했습니다:', err)
    return []
  }
}

function persistSavedDocuments(documents: SavedDocument[]) {
  try {
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents))
  } catch (err) {
    console.error('[ExplanationPage] 문서를 저장하지 못했습니다:', err)
  }
}

// Splits the AI's paragraph-style explanation into short, readable bullet
// lines (roughly 4-6) instead of one long block of text.
function splitIntoBullets(text: string, maxBullets = 6): string[] {
  if (!text) return []

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const bullets = sentences.length > 1 ? sentences : [text.trim()]
  return bullets.slice(0, maxBullets)
}

// Used for "이렇게 해보세요" and "조심하세요": flattens each item into individual
// sentences and keeps only the first (most important) maxLines of them,
// WITHOUT cutting any sentence short — every line shown is the complete
// original sentence. Display-only — does not alter the underlying OCR text
// or Gemini response.
function toFullBulletLines(items: string[], maxLines = 3): string[] {
  return items.flatMap((item) => splitIntoBullets(item, 20)).slice(0, maxLines)
}

// Key safety/medical terms that should stand out to an elderly reader.
// Longer phrases are matched before their shorter substrings (e.g. "운전 금지"
// before "운전").
const HIGHLIGHT_KEYWORDS = [
  '운전 금지', '정해진 복용량', '복용량', '복용 시간', '부작용',
  '병원', '약사', '의사', '주의사항', '경고', '위험', '사기',
  '개인정보', '비밀번호', '계좌', '이체', '송금',
].sort((a, b) => b.length - a.length)

const HIGHLIGHT_PATTERN = new RegExp(
  `(${HIGHLIGHT_KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'g'
)

function renderWithHighlights(text: string, keyPrefix: string) {
  const parts = text.split(HIGHLIGHT_PATTERN)
  return parts.map((part, index) =>
    HIGHLIGHT_KEYWORDS.includes(part) ? (
      <strong key={`${keyPrefix}-${index}`} className="font-bold text-neutral-900">
        {part}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${index}`}>{part}</span>
    )
  )
}

export default function ExplanationPage() {
  const location = useLocation<ExplanationState>()
  const navigate = useNavigate()
  const { announce } = useAccessibility()
  const { speak, isSpeaking, stopSpeaking } = useVoice()

  const [isPlaying, setIsPlaying] = useState(false)
  const [showFullOcr, setShowFullOcr] = useState(false)
  const [state, setState] = useState<ExplanationState | null>(null)
  const [showSavePrompt, setShowSavePrompt] = useState(false)

  useEffect(() => {
    // Get state from location
    if (location.state) {
      setState(location.state)
      // Only ask to save when this is a fresh analysis (i.e. it didn't come
      // from tapping an already-saved document in DocumentsPage).
      if (!location.state.savedDocumentId) {
        setShowSavePrompt(true)
      } else {
        setShowSavePrompt(false)
      }
    }
  }, [location.state])

  if (!state || !state.ocrText) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="page-container">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-primary-500" />
            </div>
            <h2 className="text-elder-xl font-bold text-neutral-800 mb-2">
              분석할 문서가 없습니다
            </h2>
            <p className="text-elder-base text-neutral-600 mb-8">
              사진을 먼저 찍어주세요
            </p>
            <button
              onClick={() => navigate('/scan', {})}
              className="btn-elder-primary px-8 py-4"
            >
              사진 찍으러 가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Use AI explanation if available, otherwise fallback
  const explanation: AIExplanation = state.aiExplanation || {
    simpleExplanation: '이 문서의 내용을 분석했습니다.',
    keyPoints: ['텍스트가 인식되었습니다'],
    actionItems: ['원문을 확인해보세요'],
    warnings: [],
  }

  // Medical documents are never treated as scams, no matter what.
  const MEDICAL_DOCUMENT_TYPES = ['hospital', 'prescription']
  const isMedicalDocument = MEDICAL_DOCUMENT_TYPES.includes(state.documentType)
  const isScam = !isMedicalDocument && !!state.isScam

  // Break the explanation paragraph into short bullet lines, and combine the
  // most relevant source into one continuous paragraph for the "꼭 기억하세요"
  // box (visually capped to ~5 lines via CSS line-clamp, not by cutting text).
  const explanationBullets = splitIntoBullets(explanation.simpleExplanation)
  const reminderSource =
    explanation.warnings.length > 0
      ? explanation.warnings
      : explanation.actionItems.length > 0
        ? explanation.actionItems
        : explanation.keyPoints
  const reminderParagraph = reminderSource.join(' ')

  // Short, elderly-friendly bullet lines for "조심하세요" (max 2 lines, full
  // sentences, no truncation). "이렇게 해보세요" shows full sentences (max 3).
  const warningBullets = toFullBulletLines(explanation.warnings, 2)
  const actionBullets = toFullBulletLines(explanation.actionItems)

  const handleReadExplanation = () => {
    if (isPlaying || isSpeaking) {
      setIsPlaying(false)
      stopSpeaking()
    } else {
      setIsPlaying(true)
      const fullText = `${explanation.simpleExplanation}. ${explanation.keyPoints.length > 0
        ? `중요한 내용입니다. ${explanation.keyPoints.slice(0, 3).map((p, i) => `${i + 1}번. ${p}`).join(', ')}.`
        : ''
        } ${explanation.actionItems.length > 0
          ? `다음을 해보세요. ${explanation.actionItems.join(', ')}.`
          : ''
        }`
      speak(fullText).then(() => setIsPlaying(false)).catch(() => setIsPlaying(false))
    }
  }

  const handleSaveDocument = () => {
    const newDocument: SavedDocument = {
      id: generateDocumentId(),
      title: DOCUMENT_TYPE_TITLES[state.documentType] || '문서',
      type: state.documentType,
      createdAt: new Date().toISOString(),
      isScam,
      imageUrl: state.imageUrl,
      ocrText: state.ocrText,
      scamRiskLevel: state.scamRiskLevel,
      confidence: state.confidence,
      aiExplanation: explanation,
    }

    const existing = loadSavedDocuments()
    persistSavedDocuments([newDocument, ...existing])

    setShowSavePrompt(false)
    announce('문서를 저장했습니다.')
  }

  const handleDontSave = () => {
    setShowSavePrompt(false)
    announce('문서를 저장하지 않았습니다.')
    navigate('/dashboard', {})
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className="page-container py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard', {})}
            className="w-12 h-12 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6 text-neutral-600" />
          </button>
          <h1 className="text-lg font-bold text-neutral-800">분석 결과</h1>
          <button
            onClick={() => navigate('/family', {})}
            className="w-12 h-12 rounded-xl bg-primary-100 hover:bg-primary-200 flex items-center justify-center transition-colors"
            aria-label="가족에게 공유"
          >
            <Share2 className="w-6 h-6 text-primary-600" />
          </button>
        </div>
      </header>

      <main className="pt-20 pb-32">
        {/* Risk Banner */}
        {isScam && (
          <div className="bg-danger-600 py-5 px-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-elder-lg font-bold text-white">
                  사기 의심 문서입니다
                </h2>
                <p className="text-elder-base text-danger-100">
                  절대 송금하지 마시고 가족에게 확인하세요
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Medical Document Banner */}
        {!isScam && isMedicalDocument && (
          <div className="bg-success-600 py-5 px-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-elder-lg font-bold text-white">
                  ✓ 의료 문서입니다
                </h2>
                <p className="text-elder-base text-success-100">
                  병원 또는 약국에서 발급된 문서로 인식되었습니다
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="page-container py-6">
          {/* Image Preview */}
          {state.imageUrl && (
            <div className="card-elder overflow-hidden mb-6">
              <img
                src={state.imageUrl}
                alt="분석한 문서"
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Confidence Score */}
          {state.confidence !== undefined && state.confidence > 0 && (
            <div className="mb-4 flex items-center justify-between text-sm text-neutral-500 px-1">
              <span>인식 정확도</span>
              <span className={`font-bold ${state.confidence > 70 ? 'text-success-600' : state.confidence > 50 ? 'text-warning-600' : 'text-danger-600'}`}>
                {Math.round(state.confidence)}%
              </span>
            </div>
          )}

          {/* Main Explanation */}
          <section className="card-elder p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isScam ? 'bg-danger-100' : 'bg-success-100'
                }`}>
                {isScam ? (
                  <AlertTriangle className="w-6 h-6 text-danger-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-success-600" />
                )}
              </div>
              <div>
                <h2 className="text-elder-xl font-bold text-neutral-900 mb-1">
                  이해한 내용
                </h2>
                <p className="text-elder-sm text-neutral-500">
                  AI가 읽어드릴게요
                </p>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {explanationBullets.map((sentence, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold text-lg leading-relaxed" aria-hidden="true">•</span>
                  <span className="text-elder-lg text-neutral-800 leading-relaxed">
                    {renderWithHighlights(sentence, `bullet-${index}`)}
                  </span>
                </li>
              ))}
            </ul>

            {reminderParagraph.length > 0 && (
              <div className="bg-warning-50 border-2 border-warning-200 rounded-elder p-5 mb-6">
                <p className="text-elder-base font-bold text-warning-700 mb-2 flex items-center gap-2">
                  <span aria-hidden="true">📌</span>
                  <span>꼭 기억하세요</span>
                </p>
                <p className="text-elder-base text-neutral-700 leading-relaxed">
                  {renderWithHighlights(reminderParagraph, 'reminder')}
                </p>
              </div>
            )}

            <button
              onClick={handleReadExplanation}
              className={`w-full ${isPlaying ? 'btn-elder-secondary' : 'btn-elder-primary'}`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-6 h-6" />
                  <span>읽기 중단</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  <span>읽어주세요</span>
                </>
              )}
            </button>
          </section>

          {/* Key Points */}
          {explanation.keyPoints.length > 0 && (
            <section className="card-elder p-6 mb-6">
              <h3 className="text-elder-lg font-bold text-neutral-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                  <span className="text-accent-600 font-bold text-lg">!</span>
                </span>
                중요한 내용
              </h3>

              <ul className="space-y-4">
                {explanation.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-elder-base text-neutral-700 pt-1">{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Items */}
          <section className="card-elder p-6 mb-6 border-2 border-primary-200 bg-primary-50">
            <h3 className="text-elder-lg font-bold text-neutral-900 mb-4 flex items-center gap-3">
              <ArrowRight className="w-6 h-6 text-primary-600" />
              이렇게 해보세요
            </h3>

            <ul className="space-y-3">
              {actionBullets.map((action, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold text-lg leading-relaxed" aria-hidden="true">•</span>
                  <span className="text-elder-base text-neutral-700">{action}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Warnings */}
          {warningBullets.length > 0 && (
            <section className="card-elder p-6 mb-6 border-2 border-warning-200 bg-warning-50">
              <h3 className="text-elder-lg font-bold text-neutral-900 mb-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-warning-600" />
                조심하세요
              </h3>

              <ul className="space-y-3">
                {warningBullets.map((warning, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-warning-600 font-bold text-lg leading-relaxed" aria-hidden="true">•</span>
                    <span className="text-elder-base text-neutral-700">{warning}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Original Text Toggle */}
          <section className="card-elder p-6">
            <button
              onClick={() => setShowFullOcr(!showFullOcr)}
              className="w-full flex items-center justify-between text-elder-base text-primary-600 mb-4"
            >
              <span className="font-bold">원문 보기 (추출된 텍스트)</span>
              <span className="text-sm">{showFullOcr ? '접기' : '펼치기'}</span>
            </button>

            {showFullOcr && (
              <div className="bg-neutral-50 rounded-elder p-4 max-h-64 overflow-y-auto">
                <p className="text-elder-sm text-neutral-600 whitespace-pre-wrap font-mono">
                  {state.ocrText || '추출된 텍스트가 없습니다.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Save Prompt Modal - shown right after a fresh analysis finishes */}
      {showSavePrompt && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-6">
          <div className="card-elder p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-neutral-900 mb-2 text-center whitespace-nowrap">
              이 문서를 저장하시겠습니까?
            </h2>
            <p className="text-elder-sm text-neutral-500 mb-6 text-center">
              저장하면 내 문서에서 다시 확인할 수 있어요
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDontSave}
                className="btn-elder-secondary flex-1"
              >
                <span>저장 안 함</span>
              </button>
              <button
                onClick={handleSaveDocument}
                className="btn-elder-primary flex-1"
              >
                <span>저장하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 safe-bottom">
        <div className="page-container max-w-4xl">
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/voice', { documentText: explanation.simpleExplanation })}
              className="btn-elder-secondary flex-1"
            >
              <MessageCircle className="w-6 h-6" />
              <span>더 물어보기</span>
            </button>
            <button
              onClick={() => navigate('/dashboard', {})}
              className="btn-elder-primary flex-1"
            >
              <span>완료</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
