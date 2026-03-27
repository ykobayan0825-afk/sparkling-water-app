"use client"

import { useInventory } from "@/contexts/inventory-context"
import { formatDateTime } from "@/lib/utils"

export function RecentHistoryList() {
  const { state, undoLastAction } = useInventory()
  const recentHistories = state.histories.slice(0, 8)

  return (
    <section className="card stack-gap">
      <div className="section-head">
        <div>
          <h2>直近履歴</h2>
        </div>
        <button type="button" className="ghost-button" onClick={undoLastAction}>
          元に戻す
        </button>
      </div>

      {recentHistories.length === 0 ? (
        <div className="empty-state">まだ履歴はありません</div>
      ) : (
        <ul className="history-list">
          {recentHistories.map((history) => (
            <li key={history.id} className="history-item">
              <div>
                <p className="history-title">
                  {history.type === "consume"
                    ? `${history.memberName ?? "不明"}が${history.quantity}本消費`
                    : `${history.quantity}本補充`}
                </p>
                <p className="history-meta">
                  {history.source === "qr" ? "QR" : "手動"} ・ {formatDateTime(history.timestamp)}
                </p>
              </div>
              <span className={history.type === "consume" ? "badge-consume" : "badge-restock"}>
                {history.type === "consume" ? "-1" : `+${history.quantity}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}