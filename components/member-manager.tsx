"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useInventory } from "@/contexts/inventory-context"
import { getMemberConsumeCount } from "@/lib/inventory-helpers"
import { buildQrConsumeUrl } from "@/lib/qr-url"

export function MemberManager() {
  const { state, addMember, updateMember, removeMember } = useInventory()
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [origin, setOrigin] = useState<string | undefined>(undefined)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  return (
    <div className="stack-gap-lg">
      <section className="card stack-gap">
        <div className="section-head">
          <div>
            <h2>メンバー追加</h2>
            <p>初期メンバー以外も自由に登録できます</p>
          </div>
        </div>

        <div className="form-row">
          <input
            className="text-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="メンバー名を入力"
          />
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              addMember(newName)
              setNewName("")
            }}
          >
            <Plus size={18} />
            追加
          </button>
        </div>
      </section>

      <section className="card stack-gap">
        <div className="section-head">
          <div>
            <h2>メンバー一覧 / QR表示</h2>
            <p>スマホ標準カメラでQRを読み取ると、そのまま1本消費を記録できます</p>
          </div>
        </div>

        <div className="member-manage-list">
          {state.members.map((member) => {
            const qrValue = buildQrConsumeUrl(member.id, origin)

            return (
              <article key={member.id} className="member-manage-card">
                <div className="member-manage-info">
                  {editingId === member.id ? (
                    <div className="form-row">
                      <input
                        className="text-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          updateMember(member.id, editingName)
                          setEditingId(null)
                          setEditingName("")
                        }}
                      >
                        保存
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3>{member.name}</h3>
                      <p className="muted-text">
                        累計消費 {getMemberConsumeCount(state.histories, member.id)}本
                      </p>
                      <p className="muted-text qr-url-preview">{qrValue}</p>
                    </>
                  )}

                  <div className="action-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingId(member.id)
                        setEditingName(member.name)
                      }}
                    >
                      <Pencil size={16} />
                      編集
                    </button>

                    <button
                      type="button"
                      className="ghost-button danger-text"
                      onClick={() => removeMember(member.id)}
                    >
                      <Trash2 size={16} />
                      削除
                    </button>
                  </div>
                </div>

                <div className="qr-card">
                  <QRCodeSVG value={qrValue} size={160} />
                  <p className="qr-caption">{member.name}用QR（標準カメラ用）</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}