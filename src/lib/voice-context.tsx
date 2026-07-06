import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface VoiceContextType {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => Promise<void>
  stopSpeaking: () => void
}

const VoiceContext = createContext<VoiceContextType | null>(null)

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognitionClass) {
      const recognitionInstance = new SpeechRecognitionClass()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'ko-KR'
      setRecognition(recognitionInstance)
    }

    // Chrome loads the speechSynthesis voice list asynchronously. Calling
    // getVoices() early (and again once it's ready) avoids the first speak()
    // call finding an empty voice list.
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      const handleVoicesChanged = () => window.speechSynthesis.getVoices()
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      }
    }
  }, [])

  const startListening = useCallback(async () => {
    if (!recognition) {
      // Web Speech API isn't available at all in this browser (e.g. many
      // mobile browsers other than Chrome/Samsung Internet on Android).
      setError('이 브라우저에서는 음성 인식을 사용할 수 없습니다. 최신 크롬(Chrome) 브라우저를 이용해주세요.')
      return
    }

    // getUserMedia/SpeechRecognition require a secure context (https or
    // localhost). On a plain http mobile page, recognition silently fails,
    // which looks like "음성 인식 자체가 안 되는" to the user.
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setError('음성 인식을 사용하려면 보안 연결(https)이 필요합니다.')
      return
    }

    setError(null)
    setTranscript('')

    // Proactively request microphone permission via getUserMedia first. On
    // several Android browsers, calling recognition.start() before the mic
    // permission has actually been granted causes it to fail silently or
    // never fire onresult, which shows up as "음성 인식이 안 됨" with no
    // clear error. Requesting (and immediately releasing) the mic stream
    // first makes the permission prompt reliable and lets us show a clear
    // message if it's denied.
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStream.getTracks().forEach((track) => track.stop())
      } catch (permErr) {
        console.error('[voice-context] 마이크 권한 요청 실패:', permErr)
        setError('마이크 권한을 허용해주세요.')
        return
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[voice-context] 음성 인식 오류:', event.error, event.message)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('마이크 권한을 허용해주세요.')
      } else if (event.error === 'no-speech') {
        setError('음성이 감지되지 않았습니다. 다시 말씀해주세요.')
      } else if (event.error === 'network') {
        setError('네트워크 연결을 확인한 후 다시 시도해주세요.')
      } else if (event.error === 'aborted') {
        // Fired when we (or the user) intentionally stop recognition
        // (e.g. tapping the mic button again). Not a real failure.
      } else {
        setError('음성 인식 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
      setIsListening(true)
    } catch (startErr) {
      // start() throws (InvalidStateError) if recognition is already running,
      // e.g. from a rapid double-tap on mobile.
      console.error('[voice-context] recognition.start() 실패:', startErr)
      setError('음성 인식을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.')
      setIsListening(false)
    }
  }, [recognition])

  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop()
      } catch (stopErr) {
        console.error('[voice-context] recognition.stop() 실패:', stopErr)
      }
      setIsListening(false)
    }
  }, [recognition])

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        const message = '음성 합성이 지원되지 않는 브라우저입니다.'
        console.error('[voice-context] TTS 미지원:', message)
        setError(message)
        reject(new Error(message))
        return
      }

      const synth = window.speechSynthesis

      const speakNow = () => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'ko-KR'
        utterance.rate = 0.8

        const koreanVoice = synth
          .getVoices()
          .find((voice) => voice.lang === 'ko-KR' || voice.lang?.startsWith('ko'))
        if (koreanVoice) {
          utterance.voice = koreanVoice
        }

        utterance.onend = () => {
          setIsSpeaking(false)
          resolve()
        }

        utterance.onerror = (event) => {
          setIsSpeaking(false)
          console.error('[voice-context] TTS 오류 발생:', event.error, event)

          // "canceled"/"interrupted" fire when we (or the user) intentionally stop
          // speech, e.g. pressing the mic again mid-sentence. That's expected
          // behavior, not a failure, so don't surface an error banner for it.
          if (event.error === 'canceled' || event.error === 'interrupted') {
            resolve()
            return
          }

          setError('음성 출력 중 오류가 발생했습니다.')
          reject(new Error(`Speech synthesis error: ${event.error}`))
        }

        setError(null)
        setIsSpeaking(true)
        synth.speak(utterance)
      }

      if (synth.speaking || synth.pending) {
        // Cancelling and immediately queuing a new utterance in the same tick is
        // a known source of spurious "canceled"/"interrupted" errors in Chrome,
        // since the cancellation hasn't actually completed yet. Give it a beat.
        synth.cancel()
        setTimeout(speakNow, 50)
      } else {
        speakNow()
      }
    })
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isSpeaking,
        transcript,
        error,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
      }}
    >
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoice() {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within VoiceProvider')
  }
  return context
}
