import Tesseract from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: { x0: number; y0: number; x1: number; y1: number }
  }>
}

export interface AIExplanation {
  simpleExplanation: string
  keyPoints: string[]
  actionItems: string[]
  warnings: string[]
}

export async function performOCR(imageData: string, onProgress?: (progress: number) => void): Promise<OCRResult> {
  const result = await Tesseract.recognize(imageData, 'kor+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress ?? 0)
      }
    },
  })

  return {
    text: result.data.text.trim(),
    confidence: result.data.confidence,
    words: result.data.words.map((word) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: word.bbox,
    })),
  }
}

const SYSTEM_PROMPT = `당신은 한국의 어르신들을 돕는 친절한 AI 도우미입니다. 어르신들이 쉽게 이해할 수 있도록 복잡한 문서나 텍스트를 자세하고 친절하게 설명해드리세요.

당신은 한국의 어르신을 돕는 친절한 AI 도우미입니다.

규칙
1. 항상 존댓말을 사용합니다.
2. 어려운 용어는 쉬운 말로 설명합니다.
3. 아래 형식으로 답변합니다.

**한줄 요약**
문서 내용을 쉽게 설명

**중요한 내용**
번호 목록으로 중요한 내용 설명

**하셔야 할 일**
어르신이 해야 할 행동

**조심하세요**
주의사항

사기·보이스피싱·송금 요구·개인정보 요구가 보이면 반드시 위험하다고 알려주세요.

약 처방전이면 약 이름, 용도, 복용법을 쉽게 설명하고 복용 시 주의사항을 알려주세요.

정부 문서이면 어떤 지원인지와 신청 방법을 쉽게 설명해주세요.
===============================

6. 정부 안내문인 경우 어떤 혜택인지, 어떻게 신청하는지 자세히 설명해주세요`

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string; thought?: boolean }>
    }
    finishReason?: string
  }>
}

/**
 * Thrown when every configured API key has been exhausted (429s) so callers
 * can show the user a friendly "AI is busy" message instead of a generic error.
 */
export class GeminiUnavailableError extends Error {
  constructor(message = '현재 AI 사용량이 많습니다. 잠시 후 다시 시도해주세요.') {
    super(message)
    this.name = 'GeminiUnavailableError'
  }
}

function getGeminiApiKeys(): string[] {
  const rawKeys = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
  ]

  const keys = rawKeys.filter((key): key is string => typeof key === 'string' && key.trim().length > 0)

  // De-duplicate in case the same key was accidentally configured twice.
  return Array.from(new Set(keys))
}

const GEMINI_REQUEST_TIMEOUT_MS = 45000
const GEMINI_RETRIES_PER_KEY = 1 // 1 extra retry (2 attempts total) per key on transient errors
const GEMINI_RETRY_DELAY_MS = 2000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function extractGeminiText(data: GeminiResponse): { text: string; finishReason?: string } | null {
  const candidate = data.candidates?.[0]
  const parts = candidate?.content?.parts ?? []

  const generatedText = parts
    .filter((part) => !part.thought && part.text)
    .map((part) => part.text)
    .join('')

  if (!generatedText) return null

  return { text: generatedText, finishReason: candidate?.finishReason }
}

/**
 * Calls the Gemini API, rotating through all configured API keys and
 * retrying on transient failures (network errors, timeouts, 5xx, 429s,
 * or an unexpectedly empty response). Gives up on a key immediately only
 * for non-recoverable errors (e.g. 400/401/403 - bad request or bad key).
 */
async function callGeminiRaw(promptText: string): Promise<{ text: string; finishReason?: string }> {
  const apiKeys = getGeminiApiKeys()

  if (apiKeys.length === 0) {
    throw new Error('Gemini API Key가 없습니다.')
  }

  let sawRateLimit = false
  let lastErrorMessage = 'Gemini 서버에 연결하지 못했습니다.'

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const apiKey = apiKeys[keyIndex]

    for (let attempt = 0; attempt <= GEMINI_RETRIES_PER_KEY; attempt++) {
      let response: Response
      try {
        response = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: promptText }],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048,
                thinkingConfig: {
                  thinkingLevel: 'low',
                },
              },
            }),
          },
          GEMINI_REQUEST_TIMEOUT_MS
        )
      } catch (networkErr) {
        const isTimeout = networkErr instanceof Error && networkErr.name === 'AbortError'
        console.error(
          `[gemini] Key ${keyIndex + 1} 요청 실패 (시도 ${attempt + 1}/${GEMINI_RETRIES_PER_KEY + 1})${isTimeout ? ' - 시간 초과' : ''}:`,
          networkErr
        )
        lastErrorMessage = isTimeout
          ? 'Gemini 서버 응답이 너무 오래 걸립니다.'
          : 'Gemini 서버에 연결하지 못했습니다.'

        if (attempt < GEMINI_RETRIES_PER_KEY) {
          await delay(GEMINI_RETRY_DELAY_MS)
          continue
        }
        break // try next key
      }

      if (response.ok) {
        const data: GeminiResponse | null = await response.json().catch((parseErr) => {
          console.error('[gemini] 응답 JSON 파싱 실패:', parseErr)
          return null
        })

        const extracted = data ? extractGeminiText(data) : null

        if (extracted) {
          return extracted
        }

        console.error('[gemini] 응답이 비어 있거나 candidates가 없습니다:', data)
        lastErrorMessage = 'Gemini 응답이 비어 있습니다.'

        if (attempt < GEMINI_RETRIES_PER_KEY) {
          await delay(GEMINI_RETRY_DELAY_MS)
          continue
        }
        break // try next key
      }

      if (response.status === 429) {
        sawRateLimit = true
        console.warn(`[gemini] Key ${keyIndex + 1} 사용량 초과(429). 다음 키로 전환합니다.`)
        await delay(GEMINI_RETRY_DELAY_MS)
        break // no point retrying the same key on 429 - move to the next key
      }

      if (response.status >= 500) {
        console.warn(`[gemini] Key ${keyIndex + 1} 서버 오류(${response.status}), 시도 ${attempt + 1}/${GEMINI_RETRIES_PER_KEY + 1}`)
        lastErrorMessage = `Gemini 서버 오류가 발생했습니다 (${response.status}).`
        if (attempt < GEMINI_RETRIES_PER_KEY) {
          await delay(GEMINI_RETRY_DELAY_MS)
          continue
        }
        break // try next key
      }

      // Non-recoverable error for this key (e.g. 400 bad request, 401/403 bad key)
      const errorText = await response.text().catch(() => '')
      console.error('[gemini] API 오류 응답:', response.status, errorText)
      lastErrorMessage = `Gemini API 오류가 발생했습니다 (${response.status}).`
      break // move to next key, this one won't succeed on retry
    }
  }

  if (sawRateLimit) {
    throw new GeminiUnavailableError()
  }

  throw new Error(lastErrorMessage)
}

async function callGemini(text: string, documentType: string): Promise<string> {
  const promptText = `${SYSTEM_PROMPT}\n\n문서 종류: ${documentType}\n\n다음 텍스트를 분석해서 어르신도 이해하기 쉽게 설명해주세요:\n\n${text}`

  const { text: generatedText, finishReason } = await callGeminiRaw(promptText)

  if (finishReason === 'MAX_TOKENS') {
    console.warn('[gemini] Gemini response was truncated by MAX_TOKENS despite thinkingLevel=low and a high token ceiling.')
  }

  return generatedText
}

function stripMarkdown(input: string): string {
  return input
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\*+/g, '')
    .replace(/^#+\s*/, '')
    .trim()
}

const SECTION_HEADERS: Record<string, string> = {
  '한줄 요약': 'summary',
  '중요한 내용': 'points',
  '하셔야 할 일': 'actions',
  '조심하세요': 'warnings',
}

// A line only counts as a section header if the ENTIRE line is wrapped in "**"
// and its label matches one of the four known headers above. A content line
// that merely starts with bold text (e.g. "**타이레놀** - 두통에 사용...")
// must NOT be mistaken for a header, or its content gets silently dropped.
function matchSectionHeader(line: string): string | null {
  const match = line.match(/^\*\*(.+?)\*\*$/)
  if (!match) return null

  const label = match[1].trim()
  for (const [key, section] of Object.entries(SECTION_HEADERS)) {
    if (label.includes(key)) return section
  }
  return null
}

function parseExplanation(text: string): AIExplanation {
  const lines = text.split('\n').filter((line) => line.trim())

  let simpleExplanation = ''
  const keyPoints: string[] = []
  const actionItems: string[] = []
  const warnings: string[] = []

  let currentSection = ''

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    const headerSection = matchSectionHeader(trimmedLine)
    if (headerSection) {
      currentSection = headerSection
      continue
    }

    switch (currentSection) {
      case 'summary': {
        const clean = stripMarkdown(trimmedLine)
        simpleExplanation = simpleExplanation ? `${simpleExplanation} ${clean}` : clean
        break
      }
      case 'points': {
        const point = stripMarkdown(trimmedLine.replace(/^\d+\.\s*/, ''))
        if (point) keyPoints.push(point)
        break
      }
      case 'actions': {
        const action = stripMarkdown(trimmedLine.replace(/^[-•*]\s*/, ''))
        if (action) actionItems.push(action)
        break
      }
      case 'warnings': {
        const warning = stripMarkdown(trimmedLine.replace(/^[-•*]\s*/, ''))
        if (warning && !warning.includes('없습니다')) {
          warnings.push(warning)
        }
        break
      }
    }
  }

  // Fallback if parsing failed
  if (!simpleExplanation) {
    simpleExplanation = stripMarkdown(text.substring(0, 200))
  }

  return { simpleExplanation, keyPoints, actionItems, warnings }
}

export async function getAIExplanation(text: string, documentType: string): Promise<AIExplanation> {
  // Check if text is too short or indicates OCR failure
  if (!text || text.length < 10 || text.includes('텍스트를 인식하지 못했습니다')) {
    return {
      simpleExplanation: '사진에서 글자를 읽지 못했습니다. 사진을 더 선명하게 찍어주세요.',
      keyPoints: ['사진이 흔들렸을 수 있어요', '밝은 곳에서 다시 찍어주세요'],
      actionItems: ['다시 사진을 찍어주세요'],
      warnings: [],
    }
  }

  const geminiText = await callGemini(text, documentType)
  return parseExplanation(geminiText)
}

const VOICE_SYSTEM_PROMPT = `당신은 한국의 어르신들을 돕는 친절한 AI 음성 도우미입니다. 어르신이 음성으로 물어보신 질문에 실제로 도움이 되는 답을 해주세요.

기본 규칙:
당신은 한국의 어르신을 돕는 AI 음성 도우미입니다.

항상 존댓말을 사용하고 쉬운 말로 답변하세요.

답변은 2~4문장 정도의 자연스러운 대화체로 작성하세요.

사기나 개인정보 요구가 있으면 반드시 주의하라고 알려주세요.

문서 내용이 함께 제공되면 그 내용을 참고하여 질문에 답변하세요.

function toPlainSpeech(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => stripMarkdown(line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '')))
    .join(' ')
    .trim()
}

/**
 * Sends the user's spoken question (optionally with document context) to Gemini
 * and returns a plain, speech-friendly answer for VoicePage. Throws on failure so
 * the caller can show/log a real error instead of a hardcoded fallback message.
 */
export async function getVoiceAnswer(userMessage: string, documentContext?: string): Promise<string> {
  const trimmedMessage = userMessage.trim()

  if (!trimmedMessage) {
    throw new Error('질문 내용이 비어 있습니다.')
  }

  const contextBlock = documentContext
    ? `\n\n참고할 문서 내용:\n${documentContext}`
    : ''

  const prompt = `${VOICE_SYSTEM_PROMPT}${contextBlock}\n\n어르신의 질문: ${trimmedMessage}`

  const { text } = await callGeminiRaw(prompt)
  const plainText = toPlainSpeech(text)

  if (!plainText) {
    console.error('[gemini] getVoiceAnswer: 정제 후 텍스트가 비어 있습니다. 원본:', text)
    throw new Error('Gemini 응답이 비어 있습니다')
  }

  return plainText
}
