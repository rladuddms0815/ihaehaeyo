import { useState, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { useRouter, useLocation } from '../lib/router'
import { X, Send } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'

interface ChatMessage {
  id: string
  sender: 'me' | 'them'
  content: string
  timestamp: Date
}

interface ChatState {
  memberName?: string
}

const AUTO_REPLIES = [
  '네, 확인했어요!',
  '알겠어요, 조심하세요!',
  '오늘도 건강 챙기세요~',
  '혹시 궁금한 거 있으면 언제든 말씀하세요.',
  '사진 찍어서 보내주시면 제가 같이 확인해볼게요.',
  '네, 저도 곧 연락드릴게요.',
  '항상 감사해요. 무리하지 마세요!',
]

function formatTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours < 12 ? '오전' : '오후'
  const displayHour = hours % 12 === 0 ? 12 : hours % 12
  return `${period} ${displayHour}:${minutes.toString().padStart(2, '0')}`
}

function buildInitialMessages(): ChatMessage[] {
  const now = Date.now()
  return [
    {
      id: 'seed-1',
      sender: 'them',
      content: '아버지, 요즘 건강은 어떠세요? 병원은 잘 다녀오셨어요?',
      timestamp: new Date(now - 1000 * 60 * 30),
    },
    {
      id: 'seed-2',
      sender: 'me',
      content: '응, 오늘 다녀왔어. 약도 새로 받아왔단다.',
      timestamp: new Date(now - 1000 * 60 * 25),
    },
    {
      id: 'seed-3',
      sender: 'them',
      content: '잘하셨어요! 약은 시간 맞춰서 꼭 챙겨 드세요.',
      timestamp: new Date(now - 1000 * 60 * 20),
    },
    {
      id: 'seed-4',
      sender: 'them',
      content: '헷갈리시면 사진 찍어서 앱으로 확인해보세요. 제가 같이 봐드릴게요.',
      timestamp: new Date(now - 1000 * 60 * 18),
    },
  ]
}

export default function ChatPage() {
  const { goBack } = useRouter()
  const location = useLocation<ChatState>()
  const { announce } = useAccessibility()

  const memberName = location.state?.memberName || '홍길동 (아들)'
  const initial = memberName.charAt(0)

  const [messages, setMessages] = useState<ChatMessage[]>(buildInitialMessages)
  const [inputText, setInputText] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const replyTimerRef = useRef<number | null>(null)

  useEffect(() => {
    announce(`${memberName}님과의 대화 화면입니다.`)
  }, [announce, memberName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isReplying])

  useEffect(() => {
    // Clean up any pending reply timer if the page unmounts mid-wait
    return () => {
      if (replyTimerRef.current) {
        window.clearTimeout(replyTimerRef.current)
      }
    }
  }, [])

  const handleSend = () => {
    const text = inputText.trim()
    if (!text) return

    const newMessage: ChatMessage = {
      id: `me-${Date.now()}`,
      sender: 'me',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputText('')
    setIsReplying(true)

    replyTimerRef.current = window.setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)]
      setMessages((prev) => [
        ...prev,
        {
          id: `them-${Date.now()}`,
          sender: 'them',
          content: reply,
          timestamp: new Date(),
        },
      ])
      setIsReplying(false)
    }, 2000)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
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
          <div className="text-center">
            <h1 className="text-lg font-bold text-neutral-800">{memberName}</h1>
            <p className="text-xs text-success-600 font-medium">온라인</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
            <span className="text-white font-bold">{initial}</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 min-h-screen">
        <div className="page-container py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${message.sender === 'me' ? 'flex-row-reverse' : ''}`}
              >
                {message.sender === 'them' && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{initial}</span>
                  </div>
                )}
                <div
                  className={`flex flex-col max-w-[75%] ${
                    message.sender === 'me' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-3 text-elder-base leading-relaxed ${
                      message.sender === 'me'
                        ? 'bg-primary-500 text-white rounded-2xl rounded-br-md'
                        : 'bg-white text-neutral-800 rounded-2xl rounded-bl-md shadow-sm'
                    }`}
                  >
                    {message.content}
                  </div>
                  <span className="text-xs text-neutral-400 mt-1 px-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {isReplying && (
              <div className="flex items-end gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{initial}</span>
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 safe-bottom">
        <div className="page-container">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요"
              className="input-elder flex-1"
              aria-label="메시지 입력"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:hover:bg-primary-500 flex items-center justify-center shrink-0 transition-colors shadow-lg"
              aria-label="보내기"
            >
              <Send className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
