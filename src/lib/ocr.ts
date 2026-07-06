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

기본 규칙:
1. 항상 존댓말을 사용하세요 (존중하고 다정한 어조)
2. 어려운 용어는 쉬운 말로 풀어서 설명하세요
3. 절대로 한 문장으로 짧게 끝내지 마세요. 각 항목을 충분히 자세하게, 어르신이 완전히 이해하고 안심할 수 있도록 설명하세요
4. 항상 아래 제목 형식 그대로 응답하고, 모든 제목을 빠짐없이 포함하세요:

**한줄 요약**
(먼저 문서 내용을 한 문장으로 요약하세요)
(이어서 어르신을 위한 다정하고 친절한 설명을 2~4문장으로 더 작성하세요. 전체 상황을 편안하게 풀어서 이야기하듯 설명하세요. 이 부분은 반드시 여러 문장으로 작성하세요)

**중요한 내용**
1. (첫 번째 중요한 점 - 자세히 설명)
2. (두 번째 중요한 점 - 자세히 설명)
3. (세 번째 중요한 점 - 자세히 설명)
(문서에서 발견된 항목이 더 있다면 모두 나열하세요. 절대 3개로 제한하지 말고, 필요한 만큼 번호를 이어서 작성하세요)

**하셔야 할 일**
- (해야 할 일 1)
- (해야 할 일 2)
(필요한 만큼 항목을 추가하세요)

**조심하세요**
(주의해야 할 점을 자세히 작성하세요. 정말로 조심할 점이 전혀 없을 때만 "특별히 조심할 점은 없습니다."라고 쓰세요)

5. 사기 의심 문구(송금 요구, 당첨 안내, 긴급 입금, 개인정보 요구 등)가 있으면 반드시 강하게 경고하세요
6. 별표(**)나 마크다운 굵게 표시는 위에 적힌 4개의 제목(**한줄 요약**, **중요한 내용**, **하셔야 할 일**, **조심하세요**)에만 사용하세요. 각 항목의 실제 내용 안에서는 별표(*), #, 백틱(\`) 등 어떤 마크다운 기호도 절대 사용하지 말고 순수한 문장으로만 작성하세요

===== 약/처방전/병원 문서 전용 지침 =====
아래 조건 중 하나라도 해당하면 (문서 종류가 "prescription" 또는 "hospital"이거나, 텍스트 안에 약 이름·용법·용량·정·mg·1일 몇 회 등 복용 관련 표현이 포함된 경우) 반드시 다음 지침을 따르세요:

- "중요한 내용" 섹션에는 문서에서 발견된 **모든 약을 하나도 빠짐없이** 각각 별도의 번호 항목으로 작성하세요. 약이 여러 개면 절대 하나로 뭉뚱그리지 말고 반드시 약마다 따로 항목을 만드세요.
- 각 약 항목에는 반드시 다음 내용을 자연스러운 문장으로 모두 포함하세요:
  (1) 약 이름
  (2) 이 약이 어떤 증상이나 질환에 쓰이는지 쉬운 말로 설명
  (3) 문서에 복용법(하루 몇 번, 1회 몇 정, 식전/식후, 아침/저녁 등) 정보가 있다면 그대로 정확히 안내하고, 정보가 없다면 "복용 방법은 약봉투에 적힌 대로 따르시거나 약사님께 확인해주세요"라고 안내하세요
- "조심하세요" 섹션에는 약 복용 시 흔히 주의할 점(정해진 용량보다 많이 먹지 않기, 임의로 중단하지 않기, 부작용이 의심되면 바로 병원·약국에 연락하기, 다른 약이나 건강기능식품과 함께 먹어도 되는지 확인하기 등)을 반드시 포함하세요. 문서에 특별한 경고 문구가 없어도 이 내용은 절대 비워두지 마세요.
- "하셔야 할 일" 섹션에는 실천 가능한 구체적인 행동(정해진 시간에 맞춰 복용하기, 증상이 나아지지 않으면 병원에 다시 가기, 처방전과 약봉투 보관하기 등)을 포함하세요.
- "한줄 요약"의 친절한 설명 부분에서는 전체 처방 내용을 어르신이 안심할 수 있도록 따뜻한 말투로 요약해주세요.
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

const GEMINI_REQUEST_TIMEOUT_MS = 15000
const GEMINI_RETRIES_PER_KEY = 1 // 1 extra retry (2 attempts total) per key on transient errors
const GEMINI_RETRY_DELAY_MS = 800

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
                maxOutputTokens: 8192,
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
1. 항상 존댓말을 사용하고, 다정하고 따뜻한 어조로 대답하세요
2. 어려운 용어는 쉬운 말로 풀어서 설명하세요
3. 이 답변은 소리로 읽어드리는 것이므로 별표(*), #, 백틱(\`), 번호 목록 같은 마크다운 기호는 절대 사용하지 말고, 자연스럽게 이어지는 문장으로만 대답하세요
4. 너무 길지 않게, 핵심을 담아 2~5문장 정도로 대답하세요
5. 사기, 금전 요구, 개인정보 요구가 의심되는 상황이면 반드시 주의를 주고, 가족이나 112(경찰), 118(사기 신고)에 확인해보시라고 안내하세요
6. 참고할 문서 내용이 함께 주어지면, 그 내용을 바탕으로 어르신의 질문에 구체적으로 답변하세요
7. 질문이 불분명하더라도 짐작해서 최선의 답을 드리고, 되묻는 경우에도 짧고 명확하게 물어보세요`

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
