import { useState } from 'react'
import { useRouter } from '../lib/router'
import { X, Type, Volume2, Bell, Shield, HelpCircle, Info, ChevronRight, UserCircle, Phone, Calendar, Check, RotateCcw } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'
import { useSession } from '../lib/session-context'

type FontSize = 'normal' | 'large' | 'xlarge'

const fontSizes: { id: FontSize; label: string; preview: string }[] = [
  { id: 'normal', label: '보통', preview: 'A' },
  { id: 'large', label: '크게', preview: 'A' },
  { id: 'xlarge', label: '아주 크게', preview: 'A' },
]

const settingsGroups = [
  {
    id: 'accessibility',
    title: '접근성 설정',
    items: [
      { id: 'text-size', icon: Type, label: '글자 크기', description: '화면의 글자를 크게 하거나 작게 합니다' },
      { id: 'voice-speed', icon: Volume2, label: '음성 속도', description: 'AI가 말하는 속도를 조절합니다' },
    ]
  },
  {
    id: 'notifications',
    title: '알림 설정',
    items: [
      { id: 'notifications', icon: Bell, label: '알림', description: '중요한 알림을 받습니다' },
    ]
  },
  {
    id: 'safety',
    title: '안전',
    items: [
      { id: 'scam-protection', icon: Shield, label: '사기 보호', description: '의심스러운 내용을 자동으로 차단합니다' },
    ]
  },
  {
    id: 'help',
    title: '도움말',
    items: [
      { id: 'help', icon: HelpCircle, label: '도움말 보기', description: '사용법을 알아봅니다' },
      { id: 'about', icon: Info, label: '이해해요 정보', description: '버전 및 개발사 정보' },
    ]
  }
]

export default function SettingsPage() {
  const { navigate, goBack } = useRouter()
  const {
    fontSize,
    setFontSize,
    voiceSpeed,
    setVoiceSpeed,
  } = useAccessibility()
  const { profile, updateProfile, resetProfile } = useSession()

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState(profile?.name || '')
  const [profileDob, setProfileDob] = useState(profile?.dateOfBirth || '')
  const [profileCaregiverPhone, setProfileCaregiverPhone] = useState(profile?.caregiverPhone || '')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  const handleStartEditProfile = () => {
    setProfileName(profile?.name || '')
    setProfileDob(profile?.dateOfBirth || '')
    setProfileCaregiverPhone(profile?.caregiverPhone || '')
    setProfileError(null)
    setProfileSaved(false)
    setIsEditingProfile(true)
  }

  const handleSaveProfile = () => {
    if (!profileName.trim()) {
      setProfileError('이름을 입력해주세요.')
      return
    }
    if (!profileDob.trim()) {
      setProfileError('생년월일을 입력해주세요.')
      return
    }
    setProfileError(null)
    updateProfile({
      name: profileName.trim(),
      dateOfBirth: profileDob.trim(),
      caregiverPhone: profileCaregiverPhone.trim(),
    })
    setIsEditingProfile(false)
    setProfileSaved(true)
  }

  const handleResetProfile = () => {
    localStorage.removeItem('ihaehaeyo_saved_documents')

    resetProfile()
    setProfileSaved(false)
    setIsEditingProfile(false)

    navigate('/')
  }

  const handleItemClick = (itemId: string) => {
    switch (itemId) {

      case 'text-size':
        document.getElementById('text-size-section')
          ?.scrollIntoView({ behavior: 'smooth' })
        break

      case 'voice-speed':
        document.querySelector('#voice-speed-section')
          ?.scrollIntoView({ behavior: 'smooth' })
        break

      case 'notifications':
        alert('알림 설정 기능입니다.')
        break

      case 'scam-protection':
        alert('AI가 의심스러운 내용을 자동으로 확인합니다.')
        break

      case 'help':
        navigate('/help')
        break

      case 'about':
        alert('이해해요\n버전 1.0\nAI 문서 설명 서비스')
        break
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
          <h1 className="text-lg font-bold text-neutral-800">설정</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="pt-20 pb-32">
        <div className="page-container py-6">
          {/* Profile Section */}
          <section
            className="mb-8"
          >
            <h2 className="text-elder-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <UserCircle className="w-6 h-6 text-primary-500" />
              프로필 수정
            </h2>

            <div className="card-elder p-5">
              {!isEditingProfile ? (
                <>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-elder-lg font-bold text-neutral-900">
                        {profile?.name || '이름 없음'}
                      </p>
                      <p className="text-elder-sm text-neutral-500">
                        {profile?.dateOfBirth || '생년월일 없음'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-5 text-neutral-600">
                    <Phone className="w-5 h-5 flex-shrink-0" />
                    <p className="text-elder-base">
                      {profile?.caregiverPhone
                        ? `보호자 전화번호: ${profile.caregiverPhone}`
                        : '보호자 전화번호가 등록되지 않았어요'}
                    </p>
                  </div>

                  {profileSaved && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-success-50 border-2 border-success-200 rounded-elder">
                      <Check className="w-5 h-5 text-success-600 flex-shrink-0" />
                      <p className="text-elder-sm text-success-700">저장되었습니다.</p>
                    </div>
                  )}

                  <button onClick={handleStartEditProfile} className="btn-elder-secondary w-full">
                    <UserCircle className="w-6 h-6" />
                    <span>정보 수정하기</span>
                  </button>
                </>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="label-elder" htmlFor="profile-name">
                      이름 <span className="text-danger-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="profile-name"
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="이름을 입력해주세요"
                        className="input-elder pl-14"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <UserCircle className="w-6 h-6 text-neutral-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label-elder" htmlFor="profile-dob">
                      생년월일 <span className="text-danger-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="profile-dob"
                        type="text"
                        value={profileDob}
                        onChange={(e) => setProfileDob(e.target.value)}
                        placeholder="예: 1945-08-15"
                        className="input-elder pl-14"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Calendar className="w-6 h-6 text-neutral-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label-elder" htmlFor="profile-caregiver-phone">
                      보호자 전화번호 <span className="text-neutral-400 font-normal">(선택)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="profile-caregiver-phone"
                        type="tel"
                        value={profileCaregiverPhone}
                        onChange={(e) => setProfileCaregiverPhone(e.target.value)}
                        placeholder="예: 010-1234-5678"
                        className="input-elder pl-14"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Phone className="w-6 h-6 text-neutral-400" />
                      </div>
                    </div>
                  </div>

                  {profileError && (
                    <div className="p-4 bg-danger-50 border-2 border-danger-200 rounded-elder">
                      <p className="text-elder-base text-danger-700 text-center">{profileError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="btn-elder-secondary flex-1"
                    >
                      취소
                    </button>
                    <button onClick={handleSaveProfile} className="btn-elder-primary flex-1">
                      <Check className="w-6 h-6" />
                      <span>저장하기</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Font Size Section */}
          <section className="mb-8">
            <h2 className="text-elder-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Type className="w-6 h-6 text-primary-500" />
              글자 크기
            </h2>

            <div className="grid grid-cols-3 gap-3" id="text-size-section">
              {fontSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setFontSize(size.id)}
                  className={`card-elder p-5 text-center transition-all ${fontSize === size.id
                    ? 'border-2 border-primary-500 bg-primary-50'
                    : 'border-2 border-neutral-200 hover:border-primary-300'
                    }`}
                >
                  <span
                    className={`block mb-2 font-bold ${size.id === 'normal' ? 'text-2xl' : size.id === 'large' ? 'text-3xl' : 'text-4xl'
                      }`}
                    style={{
                      color: fontSize === size.id ? '#ea580c' : '#525252'
                    }}
                  >
                    {size.preview}
                  </span>
                  <span className="text-elder-base font-bold text-neutral-700">
                    {size.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Voice Speed */}
          <section
            className="mb-8"
            id="voice-speed-section"
          >
            <h2 className="text-elder-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Volume2 className="w-6 h-6 text-secondary-500" />
              음성 속도
            </h2>

            <div className="card-elder p-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setVoiceSpeed(Math.max(0.5, voiceSpeed - 0.2))}
                  className="w-12 h-12 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-elder-lg font-bold text-neutral-700 transition-colors"
                >
                  -
                </button>
                <div className="text-center">
                  <span className="text-elder-2xl font-bold text-primary-600">
                    {voiceSpeed.toFixed(1)}x
                  </span>
                  <span className="block text-elder-sm text-neutral-500 mt-1">
                    {voiceSpeed <= 0.6 ? '아주 느리게' : voiceSpeed <= 1.0 ? '천천히' : '보통'}
                  </span>
                </div>
                <button
                  onClick={() => setVoiceSpeed(Math.min(1.5, voiceSpeed + 0.2))}
                  className="w-12 h-12 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-elder-lg font-bold text-neutral-700 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Preview Button */}
              <button
                onClick={() => {
                  const utterance = new SpeechSynthesisUtterance('안녕하세요, 이해해요입니다.')
                  utterance.lang = 'ko-KR'
                  utterance.rate = voiceSpeed
                  speechSynthesis.speak(utterance)
                }}
                className="btn-elder-secondary w-full"
              >
                <Volume2 className="w-5 h-5" />
                <span>미리 듣기</span>
              </button>
            </div>
          </section>

          {/* Other Settings */}
          <section className="space-y-2 mb-8">
            {settingsGroups.map((group) => (
              <div key={group.id} className="mb-6">
                <h3 className="text-elder-base font-bold text-neutral-500 mb-3 px-1">
                  {group.title}
                </h3>
                <div className="card-elder overflow-hidden">
                  {group.items.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full p-5 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors ${index !== group.items.length - 1 ? 'border-b border-neutral-100' : ''
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-neutral-600" />
                        </div>
                        <div>
                          <span className="block text-elder-base font-bold text-neutral-900">
                            {item.label}
                          </span>
                          <span className="text-elder-sm text-neutral-500">
                            {item.description}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-400" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Reset Profile */}
          <button
            onClick={handleResetProfile}
            className="btn-elder-secondary w-full border-danger-200 text-danger-600 hover:bg-danger-50"
          >
            <RotateCcw className="w-6 h-6" />
            <span>처음부터 다시 설정하기</span>
          </button>

          {/* App Version */}
          <div className="text-center mt-8">
            <p className="text-elder-sm text-neutral-400">이해해요 v1.0.0</p>
            <p className="text-elder-sm text-neutral-400 mt-1">2024 이해해요.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
