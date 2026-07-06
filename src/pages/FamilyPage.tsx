import { useState, useEffect } from 'react'
import { useRouter } from '../lib/router'
import { X, UserPlus, Users, Shield,  FileText, Clock, Trash2 } from 'lucide-react'
import { useAccessibility } from '../lib/accessibility-context'

interface FamilyMember {
  id: string
  name: string
  email: string
  relationship: string
  status: 'pending' | 'accepted'
  canViewDocuments: boolean
  canViewConversations: boolean
  canReceiveAlerts: boolean
  invitedAt: string
}

const relationships = ['아들', '딸', '손자/손녀', '형제/자매', '친척', '친구', '기타']

export default function FamilyPage() {
  const { goBack, navigate } = useRouter()
  const { announce } = useAccessibility()

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem("familyMembers")
    return saved ? JSON.parse(saved) : []
  })
  useEffect(() => {
    localStorage.setItem(
      "familyMembers",
      JSON.stringify(familyMembers)
    )
  }, [familyMembers])
  const [showInvite, setShowInvite] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRelationship, setNewRelationship] = useState('아들')
  const [showActions, setShowActions] = useState<string | null>(null)

  const handleInvite = () => {
    if (!newEmail || !newName) return

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: newName,
      email: newEmail,
      relationship: newRelationship,
      status: 'pending',
      canViewDocuments: true,
      canViewConversations: true,
      canReceiveAlerts: true,
      invitedAt: new Date().toISOString().split('T')[0],
    }

    setFamilyMembers(prev => [...prev, newMember])
    setShowInvite(false)
    setNewEmail('')
    setNewName('')
    setNewRelationship('아들')
    announce('가족에게 초대를 보냈습니다.')
  }

  const handleRemove = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id))
    setShowActions(null)
    announce('가족을 목록에서 삭제했습니다.')
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
          <h1 className="text-lg font-bold text-neutral-800">가족 공유</h1>
          <button
            onClick={() => setShowInvite(true)}
            className="w-12 h-12 rounded-xl bg-primary-100 hover:bg-primary-200 flex items-center justify-center transition-colors"
            aria-label="가족 초대"
          >
            <UserPlus className="w-6 h-6 text-primary-600" />
          </button>
        </div>
      </header>

      <main className="pt-20 pb-8">
        <div className="page-container py-6">
          {/* Info Banner */}
          <div className="card-elder border-2 border-primary-200 bg-primary-50 p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-elder-lg font-bold text-neutral-900 mb-1">
                  가족이 함께 확인해요
                </h2>
                <p className="text-elder-base text-neutral-600">
                  가족에게 초대하면 복잡한 문서를 함께 확인할 수 있어요.
                  사기 의심 문서나 의심스러운 메시지를 가족이 바로 확인해드려요.
                </p>
              </div>
            </div>
          </div>

          {/* Family Members List */}
          <section>
            <h3 className="text-elder-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-neutral-500" />
              내 가족
            </h3>

            {familyMembers.length === 0 ? (
              <div className="card-elder p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-elder-base text-neutral-600 mb-4">
                  아직 추가한 가족이 없습니다
                </p>
                <button
                  onClick={() => setShowInvite(true)}
                  className="btn-elder-primary"
                >
                  <UserPlus className="w-6 h-6" />
                  <span>가족 초대하기</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {familyMembers.map((member) => (
                  <div key={member.id} className="card-elder p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shrink-0">
                          <span className="text-elder-lg font-bold text-white">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-elder-lg font-bold text-neutral-900">
                              {member.name}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${member.status === 'accepted'
                              ? 'bg-success-100 text-success-700'
                              : 'bg-warning-100 text-warning-700'
                              }`}>
                              {member.status === 'accepted' ? '수락됨' : '대기중'}
                            </span>
                          </div>
                          <p className="text-elder-sm text-neutral-500 mb-2">
                            {member.email}
                          </p>
                          <p className="text-elder-sm text-neutral-400">
                            관계: {member.relationship}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowActions(showActions === member.id ? null : member.id)}
                        className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                      >
                        <span className="text-neutral-600 text-lg">⋯</span>
                      </button>
                    </div>

                    {/* Permissions */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-100">

                      {/* 문서 같이 보기 */}
                      <button
                        type="button"
                        onClick={() => navigate("/documents")}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        문서 같이 보기
                      </button>

                      {/* 가족에게 공유 */}
                      <button
                        type="button"
                        onClick={() =>
                          alert(`${member.name}님에게 현재 문서를 공유했습니다.`)
                        }
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-success-100 text-success-700 hover:bg-success-200 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        가족에게 공유
                      </button>

                    </div>

                    {/* Actions Dropdown */}
                    {showActions === member.id && (
                      <div className="mt-4 pt-4 border-t border-neutral-200">
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="btn-elder-danger w-full"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span>목록에서 삭제</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Benefits */}
          <section className="mt-10">
            <h3 className="text-elder-lg font-bold text-neutral-800 mb-4">
              가족에게 공유하면 좋은 점
            </h3>

            <div className="space-y-4">
              {[
                { icon: Shield, title: '사기로부터 보호', desc: '의심스러운 문서를 가족이 함께 확인해드려요' },
                {
                  icon: FileText,
                  title: '문서를 함께 확인',
                  desc: 'AI가 분석한 문서를 가족과 함께 볼 수 있어요'
                },
                { icon: Clock, title: '언제든지 확인', desc: '가족이 자리에 없어도 앱으로 함께 보아요' },
              ].map((benefit, index) => (
                <div key={index} className="card-elder p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-6 h-6 text-secondary-600" />
                  </div>
                  <div>
                    <h4 className="text-elder-base font-bold text-neutral-900 mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-elder-sm text-neutral-600">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-elder-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-elder-xl font-bold text-neutral-900">가족 초대</h2>
                <button
                  onClick={() => setShowInvite(false)}
                  className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="label-elder" htmlFor="name">이름</label>
                  <input
                    id="name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="가족분의 이름을 입력하세요"
                    className="input-elder"
                  />
                </div>

                <div>
                  <label className="label-elder" htmlFor="email">이메일</label>
                  <input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="가족 이메일 주소"
                    className="input-elder"
                  />
                </div>

                <div>
                  <label className="label-elder">관계</label>
                  <div className="grid grid-cols-2 gap-2">
                    {relationships.map((rel) => (
                      <button
                        key={rel}
                        onClick={() => setNewRelationship(rel)}
                        className={`p-3 rounded-elder text-elder-base transition-colors ${newRelationship === rel
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleInvite}
                  disabled={!newEmail || !newName}
                  className="btn-elder-primary w-full mt-4"
                >
                  <UserPlus className="w-6 h-6" />
                  <span>초대 보내기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
