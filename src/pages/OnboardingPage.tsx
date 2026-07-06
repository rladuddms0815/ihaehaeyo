import { useState } from 'react'
import { useNavigate } from '../lib/router'
import { BookOpen, ArrowRight, User, Calendar, Phone } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'
import { useSession } from '../lib/session-context'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { announce } = useAccessibility()
  const { completeOnboarding } = useSession()

  const [name, setName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [caregiverPhone, setCaregiverPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (!dateOfBirth.trim()) {
      setError('생년월일을 입력해주세요.')
      return
    }

    completeOnboarding({
      name: name.trim(),
      dateOfBirth: dateOfBirth.trim(),
      caregiverPhone: caregiverPhone.trim(),
    })

    announce('환영합니다. 시작할 준비가 되었습니다.')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="page-container py-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-neutral-900">이해해요</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-elder-2xl font-bold text-neutral-900 mb-2">
              처음 오셨군요!
            </h1>
            <p className="text-elder-base text-neutral-600">
              이름과 생년월일만 알려주시면 바로 시작할 수 있어요
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="label-elder" htmlFor="name">
                이름 <span className="text-danger-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력해주세요"
                  className="input-elder pl-14"
                  autoComplete="name"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <User className="w-6 h-6 text-neutral-400" />
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="label-elder" htmlFor="dateOfBirth">
                생년월일 <span className="text-danger-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="dateOfBirth"
                  type="text"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  placeholder="예: 1945-08-15"
                  className="input-elder pl-14"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Calendar className="w-6 h-6 text-neutral-400" />
                </div>
              </div>
            </div>

            {/* Caregiver Phone (optional) */}
            <div>
              <label className="label-elder" htmlFor="caregiverPhone">
                보호자 전화번호 <span className="text-neutral-400 font-normal">(선택)</span>
              </label>
              <div className="relative">
                <input
                  id="caregiverPhone"
                  type="tel"
                  value={caregiverPhone}
                  onChange={(e) => setCaregiverPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="input-elder pl-14"
                  autoComplete="tel"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Phone className="w-6 h-6 text-neutral-400" />
                </div>
              </div>
              <p className="text-elder-sm text-neutral-500 mt-2">
                자녀나 보호자의 번호를 남겨두시면 도움이 필요할 때 안내해드려요
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-danger-50 border-2 border-danger-200 rounded-elder">
                <p className="text-elder-base text-danger-700 text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="btn-elder-primary w-full">
              <span>시작하기</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </form>

          {/* Help Text */}
          <p className="text-elder-sm text-neutral-500 text-center mt-6">
            입력하신 정보는 이 기기에만 저장되며, 언제든지 설정에서 수정할 수 있어요
          </p>
        </div>
      </main>
    </div>
  )
}
