"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"
import { INITIAL_INVENTORY_STATE } from "@/lib/constants"
import { createConsumeHistory, createRestockHistory } from "@/lib/inventory-helpers"
import { loadInventoryState, saveInventoryState } from "@/lib/storage"
import { createId } from "@/lib/utils"
import { InventoryState, Member, UndoPayload } from "@/types/inventory"

type InventoryContextValue = {
  state: InventoryState
  isReady: boolean
  consumeByMember: (memberId: string, source?: "manual" | "qr") => void
  restock: (quantity: number) => void
  addMember: (name: string) => void
  updateMember: (memberId: string, name: string) => void
  removeMember: (memberId: string) => void
  undoLastAction: () => void
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(INITIAL_INVENTORY_STATE)
  const [isReady, setIsReady] = useState(false)
  const undoStackRef = useRef<UndoPayload[]>([])

  useEffect(() => {
    const loaded = loadInventoryState()
    setState(loaded)
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    saveInventoryState(state)
  }, [state, isReady])

  const pushUndoSnapshot = (previousState: InventoryState, label: string) => {
    undoStackRef.current.push({
      previousState: structuredClone(previousState),
      label,
    })

    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift()
    }
  }

  const undoLastAction = () => {
    const latest = undoStackRef.current.pop()

    if (!latest) {
      toast.error("元に戻せる操作がありません")
      return
    }

    setState(latest.previousState)
    toast("元に戻しました", {
      description: latest.label,
    })
  }

  const showUndoToast = (message: string, description: string) => {
    toast.success(message, {
      description,
      action: {
        label: "元に戻す",
        onClick: () => {
          undoLastAction()
        },
      },
    })
  }

  const consumeByMember = (memberId: string, source: "manual" | "qr" = "manual") => {
    setState((prev) => {
      const member = prev.members.find((item) => item.id === memberId)

      if (!member) {
        toast.error("不正なQRまたは存在しないメンバーです")
        return prev
      }

      if (prev.currentStock <= 0) {
        toast.error("在庫がありません")
        return prev
      }

      const nextHistory = createConsumeHistory({
        memberId: member.id,
        memberName: member.name,
        source,
      })

      const nextState: InventoryState = {
        ...prev,
        currentStock: prev.currentStock - 1,
        histories: [nextHistory, ...prev.histories],
      }

      pushUndoSnapshot(prev, `${member.name}の消費記録を取り消し`)
      showUndoToast(
        "入力完了しました",
        `${member.name}が1本飲みました。残り${nextState.currentStock}本です`
      )

      return nextState
    })
  }

  const restock = (quantity: number) => {
    if (quantity <= 0) return

    setState((prev) => {
      const nextHistory = createRestockHistory(quantity)
      const nextState: InventoryState = {
        ...prev,
        currentStock: prev.currentStock + quantity,
        histories: [nextHistory, ...prev.histories],
      }

      pushUndoSnapshot(prev, `補充${quantity}本を取り消し`)
      showUndoToast("補充しました", `${quantity}本追加しました。残り${nextState.currentStock}本です`)

      return nextState
    })
  }

  const addMember = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("メンバー名を入力してください")
      return
    }

    setState((prev) => {
      const nextMember: Member = {
        id: createId("member"),
        name: trimmed,
        createdAt: new Date().toISOString(),
      }

      const nextState = {
        ...prev,
        members: [...prev.members, nextMember],
      }

      pushUndoSnapshot(prev, `${trimmed}の追加を取り消し`)
      toast.success("メンバーを追加しました", {
        description: `${trimmed}を登録しました`,
        action: {
          label: "元に戻す",
          onClick: () => {
            undoLastAction()
          },
        },
      })

      return nextState
    })
  }

  const updateMember = (memberId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("メンバー名を入力してください")
      return
    }

    setState((prev) => {
      const target = prev.members.find((member) => member.id === memberId)
      if (!target) return prev

      const nextState: InventoryState = {
        ...prev,
        members: prev.members.map((member) =>
          member.id === memberId ? { ...member, name: trimmed } : member
        ),
        histories: prev.histories.map((history) =>
          history.memberId === memberId ? { ...history, memberName: trimmed } : history
        ),
      }

      pushUndoSnapshot(prev, `${target.name}の名前変更を取り消し`)
      toast.success("メンバー名を更新しました", {
        description: `${target.name} → ${trimmed}`,
        action: {
          label: "元に戻す",
          onClick: () => {
            undoLastAction()
          },
        },
      })

      return nextState
    })
  }

  const removeMember = (memberId: string) => {
    setState((prev) => {
      const target = prev.members.find((member) => member.id === memberId)
      if (!target) return prev

      const nextState: InventoryState = {
        ...prev,
        members: prev.members.filter((member) => member.id !== memberId),
      }

      pushUndoSnapshot(prev, `${target.name}の削除を取り消し`)
      toast.success("メンバーを削除しました", {
        description: `${target.name}を削除しました。履歴は保持されます`,
        action: {
          label: "元に戻す",
          onClick: () => {
            undoLastAction()
          },
        },
      })

      return nextState
    })
  }

  const value = useMemo(
    () => ({
      state,
      isReady,
      consumeByMember,
      restock,
      addMember,
      updateMember,
      removeMember,
      undoLastAction,
    }),
    [state, isReady]
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider")
  }
  return context
}