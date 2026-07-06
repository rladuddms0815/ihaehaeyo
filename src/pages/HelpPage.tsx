import { useRouter } from '../lib/router'
import { X, Camera, Mic, Shield, Users, Settings, ChevronRight, Play, BookOpen } from 'lucide-react'

const helpTopics = [
  {
    id: 'camera',
    title: '사진 찍는 방법',
    icon: Camera,
    description: '문서나 이미지를 사진으로 찍어보세요',
    steps: [
      '홈 화면에서 "사진 찍기"를 누르세요',
      '찍고 싶은 문서의 종류를 선택하세요',
      '카메라로 문서를 정면에서 찍으세요',
      '사진이 맞는지 확인하고 "분석하기"를 누르세요',
    ],
  },
  {
    id: 'voice',
    title: '음성으로 물어보기',
    icon: Mic,
    description: '말씀하시면 AI가 답해드려요',
    steps: [
      '홈 화면에서 "음성으로 물어보기"를 누르세요',
      '마이크 버튼을 누르고 말씀해주세요',
      '"이거 무슨 뜻이에요?"라고 물어보세요',
      'AI가 답변을 들려드릴 거예요',
    ],
  },
  {
    id: 'scam',
    title: '사기 의심 확인',
    icon: Shield,
    description: '의심스러운 내용을 확인하세요',
    steps: [
      '문자나 카카오톡 메시지를 사진으로 찍으세요',
      'AI가 사기인지 아닌지 확인해드려요',
      '사기로 의심되면 절대 송금하지 마세요',
      '가족에게 먼저 확인해주세요',
    ],
  },
  {
    id: 'family',
    title: '가족과 공유하기',
    icon: Users,
    description: '자녀나 손주와 함께 확인하세요',
    steps: [
      '설정에서 "가족 공유"로 가세요',
      '자녀의 이메일을 입력하고 초대를 보내세요',
      '자녀가 수락하면 함께 문서를 볼 수 있어요',
      '사기 의심 시 바로 알림을 보내요',
    ],
  },
  {
    id: 'settings',
    title: '글자 크기 바꾸기',
    icon: Settings,
    description: '화면 글자를 크게 하거나 작게 해요',
    steps: [
      '홈 화면 우측 상단 설정(톱니바퀴)을 누르세요',
      '"글자 크기"에서 원하는 크기를 선택하세요',
      '"크게" 또는 "아주 크게"를 선택하면 글자가 커져요',
    ],
  },
]

export default function HelpPage() {
  const { goBack } = useRouter()

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
          <h1 className="text-lg font-bold text-neutral-800">도움말</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="pt-20 pb-8">
        <div className="page-container py-6">
          {/* Intro */}
          <div className="card-elder border-2 border-primary-200 bg-gradient-to-br from-white to-primary-50 p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-elder-lg font-bold text-neutral-900 mb-1">
                  이해해요 도움말
                </h2>
                <p className="text-elder-base text-neutral-600">
                  사용법이 궁금하시면 아래에서 확인하세요
                </p>
              </div>
            </div>
          </div>

          {/* Help Topics */}
          <div className="space-y-4">
            {helpTopics.map((topic) => (
              <details
                key={topic.id}
                className="card-elder overflow-hidden group"
              >
                <summary className="p-5 cursor-pointer flex items-center justify-between list-none">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center">
                      <topic.icon className="w-6 h-6 text-secondary-600" />
                    </div>
                    <div>
                      <h3 className="text-elder-lg font-bold text-neutral-900">
                        {topic.title}
                      </h3>
                      <p className="text-elder-sm text-neutral-500">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-neutral-400 group-open:rotate-90 transition-transform" />
                </summary>

                <div className="px-5 pb-5 pt-0">
                  <div className="bg-neutral-50 rounded-elder p-5">
                    <ol className="space-y-3">
                      {topic.steps.map((step, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-elder-base text-neutral-700 pt-0.5">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </details>
            ))}
          </div>

          {/* Quick Start Video */}
          <div className="mt-10">
            <h2 className="text-elder-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Play className="w-6 h-6 text-primary-500" />
              영상으로 배우기
            </h2>

            <div className="card-elder p-8 text-center border-2 border-dashed border-neutral-300">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-primary-600" />
              </div>
              <p className="text-elder-base text-neutral-600 mb-4">
                자세한 사용법 영상 준비 중입니다
              </p>
              <p className="text-elder-sm text-neutral-400">
                곧 서비스가 개선되면 영상이 추가될 예정입니다
              </p>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mt-10">
            <div className="card-elder border-2 border-danger-200 bg-danger-50 p-6">
              <h3 className="text-elder-lg font-bold text-danger-700 mb-3">
                사기 피해를 입으셨나요?
              </h3>
              <p className="text-elder-base text-neutral-600 mb-4">
                만약 이미 돈을 보내셨거나 개인정보를 제공하셨다면, 즉시 경찰에 신고하세요.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="tel:112"
                  className="btn-elder-danger justify-center"
                >
                  <span>경찰 신고: 112</span>
                </a>
                <a
                  href="tel:1332"
                  className="btn-elder-secondary justify-center"
                >
                  <span>금감원 사기신고: 1332</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-10 text-center">
            <p className="text-elder-base text-neutral-600 mb-2">
              더 궁금한 점이 있으신가요?
            </p>
            <p className="text-elder-sm text-neutral-500">
              자녀나 가족에게 물어보시거나, 고객센터에 연락해주세요
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
