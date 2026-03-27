"use client"

import { useInventory } from "@/contexts/inventory-context"

export function MemberActionGrid() {
  const { state, consumeByMember, restock } = useInventory()

  return (
    <section className="card stack-gap">
      <div className="section-head">
        <div>
          <h2>ワンタップ記録</h2>
          <p>押すだけで1本消費を記録します</p>
        </div>
      </div>

      <div className="member-grid">
        {state.members.map((member) => (
          <button
            key={member.id}
            type="button"
            className="member-button"
            onClick={() => consumeByMember(member.id, "manual")}
          >
            <span className="member-button-name">{member.name}</span>
            <span className="member-button-action">-1本 記録</span>
          </button>
        ))}
      </div>

      <div className="restock-row">
        <button type="button" className="secondary-button" onClick={() => restock(6)}>
          +6本 補充
        </button>
        <button type="button" className="secondary-button" onClick={() => restock(24)}>
          +24本 補充
        </button>
      </div>
    </section>
  )
}