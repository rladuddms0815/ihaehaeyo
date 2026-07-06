import { useState } from 'react'
import { useRouter } from '../lib/router'
import { X, Shield, AlertTriangle, Phone, MessageSquare, CreditCard, Gift, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'

const scamTypes = [
  { id: 'phishing', label: '보이스피싱 전화', icon: Phone, color: 'danger' },
  { id: 'smishing', label: '문자 메시지', icon: MessageSquare, color: 'warning' },
  { id: 'banking', label: '은행/금융 사기', icon: CreditCard, color: 'danger' },
  { id: 'prize', label: '당첨/선물', icon: Gift, color: 'warning' },
]

const scamWarningSignsByType: Record<string, string[]> = {
  phishing: [
    '경찰, 검찰, 금융감독원이라며 전화로 개인정보나 계좌번호를 묻는다',
    '지금 바로 계좌에 있는 돈을 다른 곳으로 옮기라고 한다',
    '수사 중이니 비밀로 하라며 가족에게도 말하지 말라고 한다',
    '자녀가 사고를 당했다며 급하게 돈을 보내라고 한다',
    '안전한 계좌로 옮겨야 한다며 특정 계좌로 이체를 유도한다',
    '전화를 끊으면 불리해진다며 계속 통화를 유지하라고 한다',
  ],
  smishing: [
    '택배가 잘못 배송되었다며 문자 속 링크를 눌러보라고 한다',
    '모르는 번호로 온 문자에서 인증번호를 알려달라고 한다',
    '문자 속 링크를 누르면 앱을 설치하라는 화면으로 연결된다',
    '건강보험공단, 국세청 등 공공기관을 사칭한 문자가 온다',
    '문자에 적힌 전화번호로 전화하면 개인정보를 요구한다',
    '내용 확인을 유도하는 짧은 링크(bit.ly 등) 주소가 포함되어 있다',
  ],
  banking: [
    'OTP 번호나 보안카드 번호 전체를 알려달라고 한다',
    '공동인증서(구 공인인증서)를 재발급하라며 정보를 요구한다',
    '원격제어 앱을 설치하라고 안내한다',
    '대출을 해주겠다며 먼저 계좌로 돈을 보내라고 한다',
    '계좌가 범죄에 연루되었다며 즉시 이체를 요구한다',
    '은행 직원이라며 비밀번호나 계좌 정보를 전화로 확인한다',
  ],
  prize: [
    '경품에 당첨되었다며 수수료나 세금을 먼저 입금하라고 한다',
    '무료로 준다면서 배송비나 처리비를 요구한다',
    '선입금을 해야 상품을 보내준다고 한다',
    '당첨을 확인하려면 개인정보를 입력하라고 한다',
    '유명 회사를 사칭해 고가의 선물을 준다고 한다',
    '당첨금을 받으려면 특정 계좌로 먼저 돈을 보내라고 한다',
  ],
}

const scamActionsByType: Record<string, string[]> = {
  phishing: [
    '전화를 바로 끊고 다시 공식 기관 번호로 확인하세요.',
    '계좌이체나 송금을 절대 하지 마세요.',
    '개인정보나 계좌번호를 알려주지 마세요.',
    '가족이나 경찰(112)에 즉시 알리세요.',
  ],

  smishing: [
    '문자 속 링크는 절대 누르지 마세요.',
    '출처를 모르는 앱은 설치하지 마세요.',
    '문자는 삭제하고 발신 번호를 차단하세요.',
    '의심되면 112 또는 통신사에 신고하세요.',
  ],

  banking: [
    'OTP, 인증번호, 비밀번호를 알려주지 마세요.',
    '원격제어 앱은 설치하지 마세요.',
    '은행 대표번호로 직접 확인하세요.',
    '의심되면 계좌 지급정지를 요청하세요.',
  ],

  prize: [
    '선입금이나 수수료를 보내지 마세요.',
    '개인정보를 입력하지 마세요.',
    '공식 홈페이지에서 이벤트를 확인하세요.',
    '의심되면 바로 신고하세요.',
  ],
}
export default function ScamCheckPage() {
  const { navigate, goBack } = useRouter()
  const { announce } = useAccessibility()

  const [selectedType, setSelectedType] = useState<string>(scamTypes[0].id)

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    announce(`${scamTypes.find(t => t.id === typeId)?.label} 정보를 확인합니다.`)
  }

  const activeWarningSigns = scamWarningSignsByType[selectedType] ?? []
  const activeActions = scamActionsByType[selectedType] ?? []

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
          <h1 className="text-lg font-bold text-neutral-800">사기 신고/확인</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="pt-20 pb-8">
        <div className="page-container py-6">
          {/* Warning Banner */}
          <div className="bg-danger-600 rounded-elder-lg p-6 mb-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-elder-lg font-bold mb-2">
                  의심되는 일이 있으신가요?
                </h2>
                <p className="text-elder-base text-danger-100">
                  사기 의심 문구를 확인하고 대처 방법을 알아보세요.
                </p>
              </div>
            </div>
          </div>

          {/* Scam Types */}
          <section className="mb-8">
            <h3 className="text-elder-lg font-bold text-neutral-800 mb-4">
              어떤 일이 있으셨나요?
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {scamTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`card-elder p-5 text-center transition-all ${selectedType === type.id
                      ? `border-2 border-${type.color}-500 bg-${type.color}-50`
                      : 'border-2 border-neutral-200 hover:border-primary-300'
                    }`}
                  style={selectedType === type.id ? {
                    borderColor: type.color === 'danger' ? '#dc2626' : '#f59e0b',
                    backgroundColor: type.color === 'danger' ? '#fef2f2' : '#fffbeb',
                  } : {}}
                >
                  <div className={`w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center ${type.color === 'danger' ? 'bg-danger-100' : 'bg-warning-100'
                    }`}>
                    <type.icon className={`w-7 h-7 ${type.color === 'danger' ? 'text-danger-600' : 'text-warning-600'
                      }`} />
                  </div>
                  <span className="text-elder-base font-bold text-neutral-800">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Warning Signs */}
          <section className="mb-8">
            <h3 className="text-elder-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-danger-500" />
              사기 신고 징후
            </h3>

            <div className="card-elder overflow-hidden">
              {activeWarningSigns.map((sign, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-5 ${index !== activeWarningSigns.length - 1 ? 'border-b border-neutral-100' : ''
                    }`}
                >
                  <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center shrink-0">
                    <X className="w-5 h-5 text-danger-600" />
                  </div>
                  <span className="text-elder-base text-neutral-700">{sign}</span>
                </div>
              ))}
            </div>
          </section>

          {/* What to Do */}
          <section className="mb-8">
            <h3 className="text-elder-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-success-500" />
              이렇게 대처하세요
            </h3>

            {activeActions.map((action, index) => (
              <div key={index} className="card-elder p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                </div>

                <span className="text-elder-base text-neutral-700">
                  {action}
                </span>
              </div>
            ))}
          </section>

          {/* Emergency Numbers */}
          <section className="mb-8">
            <h3 className="text-elder-lg font-bold text-neutral-800 mb-4">
              신고 전화
            </h3>

            <div className="space-y-3">
              <a href="tel:112" className="card-elder p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
                    <span className="text-elder-lg font-bold text-danger-600">112</span>
                  </div>
                  <div>
                    <span className="block text-elder-base font-bold text-neutral-900">경찰</span>
                    <span className="text-elder-sm text-neutral-500">사기 신고</span>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-400" />
              </a>

              <a href="tel:1332" className="card-elder p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center">
                    <span className="text-elder-lg font-bold text-warning-600">1332</span>
                  </div>
                  <div>
                    <span className="block text-elder-base font-bold text-neutral-900">금융감독원</span>
                    <span className="text-elder-sm text-neutral-500">금융사기 신고</span>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-400" />
              </a>
            </div>
          </section>

          {/* Scan Suspicious Message */}
          <div className="card-elder border-2 border-primary-200 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-elder-lg font-bold text-neutral-900 mb-2">
              의심스러운 문자를 확인하고 싶으신가요?
            </h3>
            <p className="text-elder-base text-neutral-600 mb-4">
              사진을 찍으면 AI가 사기인지 확인해드려요
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="btn-elder-primary w-full"
            >
              사진 찍어 확인하기
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
