import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from '../lib/router'
import { Camera, X, Image, Flashlight, FlashlightOff, RotateCcw, Loader2 } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'
import { performOCR, getAIExplanation, GeminiUnavailableError } from '../lib/ocr'

type DocumentType = 'hospital' | 'prescription' | 'government' | 'banking' | 'scam' | 'app' | 'general'

const documentTypes = [
  { id: 'hospital', label: '병원 문서', icon: '🏥' },
  { id: 'prescription', label: '약/처방전', icon: '💊' },
  { id: 'government', label: '정부 안내문', icon: '🏛️' },
  { id: 'banking', label: '은행/카드', icon: '💳' },
  { id: 'scam', label: '사기 의심', icon: '🚨' },
  { id: 'app', label: '앱 화면', icon: '📱' },
  { id: 'general', label: '기타', icon: '📄' },
]

export default function ScanPage() {
  const { navigate, goBack } = useRouter()
  const { announce } = useAccessibility()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [step, setStep] = useState<'select' | 'camera' | 'preview' | 'processing'>('select')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('general')
  const [flashOn, setFlashOn] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Attach the live stream to the video element once it has mounted
  useEffect(() => {
    if (step === 'camera' && stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch((err) => {
        console.error('Video play error:', err)
      })
    }
  }, [step, stream])

  // Handle image file from camera or gallery
  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 선택할 수 있습니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (result && typeof result === 'string') {
        setCapturedImage(result)
        setStep('preview')
        setError(null)
        announce('사진을 불러왔습니다. 확인해주세요.')
      }
    }
    reader.onerror = () => {
      setError('이미지를 불러오는데 실패했습니다.')
    }
    reader.readAsDataURL(file)
  }, [announce])

  // Handle camera input change (capture="environment")
  const handleCameraInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
    // Reset input so same file can be selected again
    event.target.value = ''
  }, [handleImageFile])

  // Handle gallery input change
  const handleGalleryInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
    // Reset input so same file can be selected again
    event.target.value = ''
  }, [handleImageFile])

  // Open native camera on mobile
  const openNativeCamera = useCallback(() => {
    cameraInputRef.current?.click()
  }, [])

  // Open gallery
  const openGallery = useCallback(() => {
    galleryInputRef.current?.click()
  }, [])

  // Start live camera view (for devices that support it)
  const startLiveCamera = async () => {
    try {
      setError(null)

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to native camera input
        openNativeCamera()
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      })

      setStream(mediaStream)
      setStep('camera')
      announce('카메라가 켜졌습니다. 사진을 찍어주세요.')
    } catch (err: unknown) {
      console.error('Camera error:', err)

      // If permission denied or not supported, use native camera input
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.')
          announce('카메라 권한이 필요합니다.')
        } else if (err.name === 'NotFoundError') {
          // No camera found, use file input
          openNativeCamera()
        } else {
          // Other errors - fallback to native camera
          openNativeCamera()
        }
      } else {
        openNativeCamera()
      }
    }
  }

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  // Capture photo from live camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setError('카메라를 초기화할 수 없습니다.')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 1920
    canvas.height = video.videoHeight || 1080

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('이미지를 캡처할 수 없습니다.')
      return
    }

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    stopCamera()
    setStep('preview')
    setError(null)
    announce('사진을 찍었습니다. 확인해주세요.')
  }, [stopCamera, announce])

  // Toggle flash (if supported)
  const toggleFlash = async () => {
    if (!stream) return

    const track = stream.getVideoTracks()[0]
    if (!track) return

    try {
      // `torch` is a non-standard capability (not in the TS DOM lib's
      // MediaTrackCapabilities type) supported by some mobile browsers.
      const capabilities = track.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined
      if (capabilities?.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn } as MediaTrackConstraintSet]
        })
        setFlashOn(!flashOn)
      } else {
        // Flash not supported
        announce('이 기기에서는 플래시를 지원하지 않습니다.')
      }
    } catch (err) {
      console.error('Flash error:', err)
    }
  }

  // Retake photo
  const retake = useCallback(() => {
    setCapturedImage(null)
    setError(null)
    setStep('select')
  }, [])

  // Process image with OCR and AI
  const processImage = async () => {
    if (!capturedImage) {
      setError('이미지가 없습니다. 다시 사진을 찍어주세요.')
      return
    }

    setStep('processing')
    setProgress(0)
    setProgressMessage('글자를 인식하고 있어요...')
    announce('사진을 분석하고 있습니다. 잠시만 기다려주세요.')

    try {
      // Step 1: Perform real OCR (0-60%)
      const ocrResult = await performOCR(capturedImage, (p) => {
        setProgress(Math.round(p * 60))
      })

      let ocrText = ocrResult.text.trim()

      // If OCR result is empty or very short
      if (!ocrText || ocrText.length < 5) {
        ocrText = '[텍스트를 인식하지 못했습니다]'
        setProgressMessage('분석을 완료하고 있어요...')
        setProgress(100)

        navigate('/explanation', {
          imageUrl: capturedImage,
          ocrText: ocrText,
          documentType: documentType,
          isScam: false,
          scamRiskLevel: 'none',
          confidence: 0,
          aiExplanation: {
            simpleExplanation: '사진에서 글자를 읽지 못했습니다. 사진을 더 선명하게 찍어주세요.',
            keyPoints: ['사진이 흔들렸을 수 있어요', '밝은 곳에서 다시 찍어주세요', '글자가 뚜렷한지 확인해주세요'],
            actionItems: ['다시 사진을 찍어주세요', '밝은 곳에서 찍어주세요'],
            warnings: [],
          },
        })
        return
      }

      // Step 2: Get AI explanation from Gemini (60-100%)
      setProgress(60)
      setProgressMessage('쉽게 설명하고 있어요...')
      announce('글자를 읽었어요. 이제 쉽게 설명하고 있어요.')

      const aiExplanation = await getAIExplanation(ocrText, documentType)

      setProgress(100)

      // Detect scam indicators.
      // Medical documents (hospital / prescription) are never treated as scams,
      // no matter what keywords happen to appear in them.
      const MEDICAL_DOCUMENT_TYPES = ['hospital', 'prescription']
      const isMedicalDocument = MEDICAL_DOCUMENT_TYPES.includes(documentType)

      // Only strong, specific scam signals count — generic words like '긴급'
      // or '사고' routinely show up in ordinary medical text (e.g. side-effect
      // warnings about drowsiness/accidents) and caused false positives before.
      const BANK_ACCOUNT_PATTERN = /\d{2,6}-\d{2,6}-\d{2,8}/
      const scamPhrases = [
        // money transfer requests
        '지금 송금', '즉시 송금', '바로 송금', '송금해 주세요', '송금 부탁', '이체해 주세요', '입금해 주세요', '입금 부탁',
        // gift cards
        '문화상품권', '구글 기프트카드', '기프트카드', '상품권 번호', '상품권 핀번호', '상품권으로 결제',
        // urgent payment requests
        '긴급 입금', '즉시 입금', '오늘 안에 입금', '미납금 즉시', '체납액 즉시', '지금 바로 입금',
        // impersonation
        '검찰청', '경찰청을 사칭', '금융감독원', '국세청 환급', '자녀를 사칭', '손자를 사칭', '가족을 사칭', '수사기관',
        // suspicious SMS / messenger scams
        '링크를 클릭', '문자 속 링크', '앱 설치 후 인증', '본인인증 코드 요청', '원격제어 앱 설치', '택배 조회 링크',
      ]

      const combinedText = `${ocrText}\n${aiExplanation.warnings.join('\n')}`
      const detectedScamSignals = isMedicalDocument
        ? []
        : scamPhrases.filter((phrase) => combinedText.includes(phrase))

      if (!isMedicalDocument && BANK_ACCOUNT_PATTERN.test(combinedText)) {
        detectedScamSignals.push('계좌번호 형식 발견')
      }

      const isScam = detectedScamSignals.length > 0
      const scamRiskLevel = detectedScamSignals.length >= 3 ? 'high' : detectedScamSignals.length >= 1 ? 'medium' : 'none'

      // Navigate to explanation page
      navigate('/explanation', {
        imageUrl: capturedImage,
        ocrText: ocrText,
        documentType: documentType,
        isScam: isScam,
        scamRiskLevel: scamRiskLevel,
        confidence: ocrResult.confidence,
        aiExplanation: aiExplanation,
      })
    } catch (err) {
      console.error('Processing Error:', err)
      const message =
        err instanceof GeminiUnavailableError
          ? err.message
          : '이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.'
      setError(message)
      setStep('preview')
      announce(message)
    }
  }

  // Handle back navigation
  const handleBack = useCallback(() => {
    stopCamera()
    goBack()
  }, [stopCamera, goBack])

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Hidden Canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraInputChange}
        className="hidden"
        aria-label="카메라로 사진 찍기"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryInputChange}
        className="hidden"
        aria-label="앨범에서 사진 선택"
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/90 backdrop-blur">
        <div className="page-container py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="뒤로 가기"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">사진 찍기</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Select Document Type */}
      {step === 'select' && (
        <div className="min-h-screen bg-white pt-20">
          <div className="page-container py-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-elder-xl font-bold text-neutral-900 mb-2">
                무엇을 찍으시겠어요?
              </h2>
              <p className="text-elder-base text-neutral-600">
                어떤 종류의 문서인지 선택해주세요
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {documentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setDocumentType(type.id as DocumentType)
                    announce(`${type.label} 선택됨`)
                  }}
                  className={`card-elder p-5 text-center transition-all ${
                    documentType === type.id
                      ? 'border-2 border-primary-500 bg-primary-50'
                      : 'border-2 border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <span className="text-3xl mb-2 block">{type.icon}</span>
                  <span className="text-elder-base font-bold text-neutral-800">{type.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={startLiveCamera}
                className="btn-elder-primary w-full text-lg"
              >
                <Camera className="w-7 h-7" />
                <span>카메라로 사진 찍기</span>
              </button>

              <button
                onClick={openGallery}
                className="btn-elder-secondary w-full text-lg"
              >
                <Image className="w-7 h-7" />
                <span>앨범에서 사진 선택</span>
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-danger-50 border-2 border-danger-200 rounded-elder">
                <p className="text-elder-base text-danger-700 text-center">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Camera View */}
      {step === 'camera' && (
        <div className="fixed inset-0 bg-black">
          {/* Video Preview - fills the entire screen behind the controls */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Focus Guide - sized relative to the viewport (roughly 70-80% of
              width on typical phones) instead of a fixed pixel size, capped so
              it doesn't grow too large on desktop or overflow on short/landscape
              screens, while staying centered and keeping the same look. */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
            <div
              className="aspect-[9/10] w-full max-w-[30rem] border-4 border-white/60 rounded-2xl"
              style={{ width: 'min(78vw, 30rem, 56vh)' }}
            />
          </div>
          {/* Instructions */}
          <div className="absolute top-24 left-0 right-0 text-center pointer-events-none">
            <p className="text-white/80 text-lg font-medium bg-black/40 inline-block px-4 py-2 rounded-lg">
              문서가 테두리 안에 오도록 맞추세요
            </p>
          </div>

          {/* Camera Controls - pinned to the bottom of the viewport (not the flex
              flow), above the safe area, and above the video preview, so the
              capture button is always visible on both desktop and mobile
              regardless of the video's rendered height. */}
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-black py-8 px-4 safe-bottom">
            <div className="flex items-center justify-center gap-8">
              {/* Flash Button */}
              <button
                onClick={toggleFlash}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  flashOn ? 'bg-warning-500' : 'bg-white/20 hover:bg-white/30'
                }`}
                aria-label={flashOn ? '플래시 끄기' : '플래시 켜기'}
              >
                {flashOn ? (
                  <Flashlight className="w-7 h-7 text-white" />
                ) : (
                  <FlashlightOff className="w-7 h-7 text-white" />
                )}
              </button>

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
                aria-label="사진 찍기"
              >
                <div className="w-20 h-20 rounded-full border-4 border-primary-500 hover:border-primary-600 transition-colors" />
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  stopCamera()
                  setStep('select')
                  setError(null)
                }}
                className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="취소"
              >
                <X className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {step === 'preview' && capturedImage && (
        <div className="min-h-screen bg-neutral-900 pt-20">
          <div className="page-container py-6">
            <div className="relative">
              <img
                src={capturedImage}
                alt="촬영한 사진"
                className="w-full rounded-elder-lg shadow-2xl"
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-elder-base text-white mb-2">
                이 사진이 맞나요?
              </p>
              <p className="text-elder-sm text-neutral-400">
                {documentTypes.find(t => t.id === documentType)?.label}로 분석됩니다
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-danger-500/20 border border-danger-500 rounded-elder">
                <p className="text-elder-base text-white text-center">{error}</p>
              </div>
            )}

            <div className="mt-8 space-y-4">
              <button
                onClick={processImage}
                className="btn-elder-primary w-full text-lg"
              >
                <span>이 사진으로 분석하기</span>
              </button>

              <button
                onClick={retake}
                className="btn-elder-secondary w-full text-lg bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <RotateCcw className="w-6 h-6" />
                <span>다시 찍기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing */}
      {step === 'processing' && (
        <div className="min-h-screen bg-white pt-20">
          <div className="page-container py-6 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
              </div>
              <div className="pulse-ring" />
            </div>

            <h2 className="text-elder-xl font-bold text-neutral-900 mb-2 text-center">
              사진을 분석하고 있어요
            </h2>

            <div className="w-64 h-3 bg-neutral-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-elder-base text-neutral-600 text-center">
              {progressMessage}
            </p>

            <p className="text-elder-sm text-neutral-400 mt-4 text-center">
              {progress < 60 ? '사진 속 글자를 읽고 있어요' : '어르신도 이해하기 쉽게 설명하고 있어요'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
