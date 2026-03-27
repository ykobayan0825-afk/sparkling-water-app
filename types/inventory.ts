export type HistoryType = "consume" | "restock"
export type HistorySource = "manual" | "qr"

export type Member = {
  id: string
  name: string
  createdAt: string
}

export type StockHistory = {
  id: string
  type: HistoryType
  quantity: number
  memberId?: string
  memberName?: string
  source: HistorySource
  timestamp: string
}

export type InventoryState = {
  currentStock: number
  histories: StockHistory[]
  members: Member[]
}

export type UndoPayload = {
  previousState: InventoryState
  label: string
}