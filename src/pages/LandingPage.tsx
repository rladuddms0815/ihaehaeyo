import { useNavigate } from '../lib/router'
import { Camera, MessageCircle, Shield, Users, Mic, BookOpen, ArrowRight, CheckCircle } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'

const features = [
  {
    icon: Camera,
    title: '사진 한 장이면 충분해요',
    description: '어려운 문서, 영수증, 약 봉투, 문자 메시지를 사진으로 찍으면 AI가 알기 쉽게 설명해드려요.',
  },
  {
    icon: MessageCircle,
    title: '무엇이든 물어보세요',
    description: '"이거 무슨 뜻이야?" "이거 진짜 병원에서 보낸 거 맞아?" 음성으로 물어보시면 바로 답해드려요.',
  },
  {
    icon: Shield,
    title: '보이스피싱 예방',
    description: '의심스러운 문자나 전화를 받으셨나요? 사진을 찍으시면 사기인지 바로 확인해드려요.',
  },
  {
    icon: Users,
    title: '가족과 함께',
    description: '자녀나 손주에게 도움을 요청하고, 복잡한 일을 함께 확인할 수 있어요.',
  },
]

const useCases = [
  {
    title: '병원 문서',
    example: '진료내역서, 수술 동의서, 검사 결과지',
    color: 'bg-secondary-100 border-secondary-300',
  },
  {
    title: '약 봉투/처방전',
    example: '복용 방법, 주의사항, 약 이름',
    color: 'bg-primary-100 border-primary-300',
  },
  {
    title: '정부 안내문',
    example: '연금 신청서, 세금 고지서, 혜택 안내',
    color: 'bg-accent-100 border-accent-300',
  },
  {
    title: '은행/카드',
    example: '이체, 거래내역, 청구서, 앱 화면',
    color: 'bg-warm-100 border-warm-300',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { announce } = useAccessibility()

  const handleStart = () => {
    announce('시작하기 버튼을 누르셨습니다.')
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-100">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 opacity-80" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-200" />

        <div className="relative page-container py-12 lg:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-primary-200 rounded-full px-5 py-2 mb-6 shadow-sm">
              <Mic className="w-5 h-5 text-primary-600" />
              <span className="text-elder-base text-primary-700 font-medium">
                말로만 물어보세요
              </span>
            </div>

            <h1 className="text-elder-3xl lg:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
              어려운 문서, 이제{' '}
              <span className="text-primary-600">이해해요</span>
              와 함께
            </h1>

            <p className="text-elder-xl text-neutral-600 mb-8 leading-relaxed">
              병원 문서, 약 봉투, 정부 안내문, 의심스러운 문자까지<br />
              사진 한 장으로 쉽게 이해하고 안전하게 확인하세요
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStart}
                className="btn-elder-primary text-lg px-10 py-5"
              >
                <span>무료로 시작하기</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-neutral-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="text-elder-sm">무료 사용</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="text-elder-sm">가입 없이 체험</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="text-elder-sm">24시간 확인</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Use Cases */}
      <section className="page-container py-12 lg:py-16 bg-white">
        <h2 className="section-title text-center mb-3">이런 것들을 도와드려요</h2>
        <p className="section-subtitle text-center mb-10">
          사진만 찍으면 AI가 친절하게 설명해드려요
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`card-elder p-6 border-2 ${useCase.color} animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="text-elder-lg font-bold text-neutral-800 mb-2">
                {useCase.title}
              </h3>
              <p className="text-elder-base text-neutral-600">{useCase.example}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="page-container py-12 lg:py-16">
        <h2 className="section-title text-center mb-3">간편하게 사용하는 방법</h2>
        <p className="section-subtitle text-center mb-10">
          읽기 어렵거나 이해가 안 되는 모든 것을 이해해요가 도와드려요
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card-elder p-8 hover:border-primary-300 border-2 border-transparent transition-all animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 shadow-lg">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-elder-xl font-bold text-neutral-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-elder-base text-neutral-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-12 lg:py-16">
        <div className="page-container">
          <h2 className="section-title text-center mb-3">사용법은 아주 간단해요</h2>
          <p className="section-subtitle text-center mb-10">
            세 번만 누르면 끝!
          </p>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {[
              { num: '1', text: '사진 찍기', icon: Camera, color: 'primary' },
              { num: '2', text: 'AI 설명 듣기', icon: BookOpen, color: 'secondary' },
              { num: '3', text: '질문하기', icon: Mic, color: 'accent' },
            ].map((step, index) => (
              <div key={index} className="flex flex-col items-center animate-scale-in" style={{ animationDelay: `${index * 150}ms` }}>
                <div className={`w-20 h-20 rounded-full bg-${step.color}-500 border-4 border-white shadow-xl flex items-center justify-center mb-4`}
                  style={{ backgroundColor: step.color === 'primary' ? '#f97316' : step.color === 'secondary' ? '#22c55e' : '#3b82f6' }}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-elder-xl font-bold text-neutral-800">{step.num}. {step.text}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleStart}
              className="btn-elder-primary text-lg px-10 py-5"
            >
              지금 바로 시작하기
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Safety Feature */}
      <section className="page-container py-12 lg:py-16">
        <div className="card-elder lg:card-elder-bordered border-2 border-danger-200 bg-gradient-to-br from-white to-danger-50 p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-danger-500 flex items-center justify-center shadow-xl shrink-0">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-elder-2xl font-bold text-neutral-900 mb-3">
                보이스피싱, 사기 걱정하지 마세요
              </h2>
              <p className="text-elder-lg text-neutral-600 leading-relaxed">
                의심스러운 문자나 전화를 받으셨나요? "송금해주세요"라는 요청?
                사진 한 장이면 사기인지 바로 확인해드려요. 24시간 언제든
                이용할 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 py-12 lg:py-16">
        <div className="page-container text-center">
          <h2 className="text-elder-2xl lg:text-3xl font-bold text-white mb-4">
            혼자 고민하지 마세요
          </h2>
          <p className="text-elder-lg text-neutral-300 mb-8">
            이해해요가 도와드릴게요
          </p>
          <button
            onClick={handleStart}
            className="bg-white hover:bg-neutral-100 text-neutral-900 font-bold py-4 px-10 rounded-elder text-lg transition-all shadow-xl"
          >
            무료로 시작하기
            <ArrowRight className="w-6 h-6 inline ml-2" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-100 py-8">
        <div className="page-container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-800">이해해요</span>
            </div>
            <p className="text-elder-sm text-neutral-500">
              2024 이해해요. 모든 것이 이해될 때까지.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
