"use client"

import { MemberActionGrid } from "@/components/member-action-grid"
import { QRScannerSheet } from "@/components/qr-scanner-sheet"
import { RecentHistoryList } from "@/components/recent-history-list"
import { StockSummary } from "@/components/stock-summary"

export default function HomePage() {
  return (
    <div className="stack-gap-lg">
      <StockSummary />
      <MemberActionGrid />
      <QRScannerSheet />
      <RecentHistoryList />
    </div>
  )
}