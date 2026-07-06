import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from '../lib/router'
import { X, Mic, MicOff, Volume2, Loader2, User, Bot } from 'lucide-react'
import { useVoice } from '../lib/voice-context'
import { useAccessibility } from '../lib/accessibility-context'
import { getVoiceAnswer, GeminiUnavailableError } from '../lib/ocr'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface VoiceState {
  documentText?: string
}

const suggestedQuestions = [
  '이거 무슨 뜻이에요?',
  '이거 진짜 병원에서 보낸 거 맞아요?',
  '돈 내라고 하는데 어떡하죠?',
  '이거 보내야 하나요?',
  '이 약 어떻게 먹어요?',
]

export default function VoicePage() {
  const navigate = useNavigate()
  const location = useLocation<VoiceState>()
  const { announce } = useAccessibility()
  const {
    isListening,
    isSpeaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoice()

  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [initialState, setInitialState] = useState<VoiceState | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get state from location
    if (location.state) {
      setInitialState(location.state)
    }
  }, [location.state])

  useEffect(() => {
    // Add initial context message if provided
    if (initialState?.documentText) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: '방금 확인한 문서에 대해 궁금한 점이 있으면 물어보세요.',
          timestamp: new Date(),
        },
      ])
    } else {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: '무엇이 궁금하세요? 말씀해주시면 도와드릴게요.',
          timestamp: new Date(),
        },
      ])
    }
    announce('음성 도우미 화면입니다. 말씀하시면 답해드려요.')
  }, [announce, initialState])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (transcript && !isListening) {
      handleUserMessage(transcript)
    }
  }, [transcript, isListening])

  const handleUserMessage = async (userMessage: string) => {
    console.log("handleUserMessage 호출:", userMessage)
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newUserMessage])
    setIsProcessing(true)

    let aiResponse: string
    try {
      aiResponse = await getVoiceAnswer(userMessage, initialState?.documentText)
    } catch (err) {
      console.error('[VoicePage] Gemini 응답 생성 실패:', err)
      setIsProcessing(false)
      const fallbackContent =
        err instanceof GeminiUnavailableError
          ? err.message
          : '지금은 답변을 드리기 어려워요. 잠시 후 다시 말씀해주세요.'
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      announce(fallbackContent)

      // Still try to speak the fallback so the experience feels consistent
      // with a normal answer, but never let a TTS failure surface as an error.
      speak(fallbackContent).catch((speakError) => {
        console.error('[VoicePage] TTS 재생 실패(오류 안내):', speakError)
      })
      return
    }

    const newAssistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newAssistantMessage])
    setIsProcessing(false)

    try {
      await speak(aiResponse)
    } catch (speakError) {
      console.error('[VoicePage] TTS 재생 실패:', speakError)
    }
  }

  const handleMicToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      if (isSpeaking) {
        stopSpeaking()
      }
      startListening()
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleUserMessage(question)
  }

  const handleStopSpeaking = () => {
    stopSpeaking()
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
          <h1 className="text-lg font-bold text-neutral-800">음성으로 물어보기</h1>
          <button
            onClick={handleStopSpeaking}
            disabled={!isSpeaking}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSpeaking ? 'bg-danger-100 hover:bg-danger-200' : 'bg-neutral-100'
              }`}
            aria-label="읽기 중단"
          >
            <Volume2 className={`w-6 h-6 ${isSpeaking ? 'text-danger-600' : 'text-neutral-400'}`} />
          </button>
        </div>
      </header>

      <main className="pt-20 pb-40 min-h-screen">
        {/* Message List */}
        <div className="page-container py-6">
          <div className="space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {message.role === 'assistant' ? (
                  <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6 text-secondary-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                )}

                <div
                  className={`card-elder p-5 max-w-[80%] ${message.role === 'user'
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-white'
                    }`}
                >
                  <p className={`text-elder-base leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-neutral-800'
                    }`}>
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-secondary-600" />
                </div>
                <div className="card-elder p-5 bg-white">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    <span className="text-elder-base text-neutral-500">답변 생각 중...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Suggested Questions */}
      <div className="fixed bottom-24 left-0 right-0 overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-2 pb-2">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedQuestion(question)}
              className="shrink-0 bg-white border-2 border-neutral-200 hover:border-primary-400 rounded-full px-4 py-3 text-elder-sm text-neutral-700 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Control Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-6 safe-bottom">
        <div className="page-container max-w-4xl">
          <div className="flex flex-col items-center">
            {error && (
              <p className="text-elder-sm text-danger-600 mb-4 text-center">{error}</p>
            )}

            {isListening && (
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary-500 rounded-full"
                    style={{
                      height: `${12 + Math.random() * 20}px`,
                      animation: `waveform 0.5s ease-in-out infinite ${i * 0.1}s`,
                    }}
                  />
                ))}
                <span className="ml-3 text-elder-base text-primary-600 font-medium">듣고 있어요...</span>
              </div>
            )}

            <button
              onClick={handleMicToggle}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all ${isListening
                  ? 'bg-danger-500 hover:bg-danger-600 scale-110'
                  : 'bg-primary-500 hover:bg-primary-600'
                } disabled:opacity-60`}
              aria-label={isListening ? '말하기 중지' : '말하기'}
            >
              {isListening ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </button>

            <p className="text-elder-base text-neutral-500 mt-4">
              {isListening ? '말씀해주세요...' : '버튼을 누르고 말씀해주세요'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
