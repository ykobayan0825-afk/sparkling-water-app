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
import {
  createConsumeHistory,
  createRestockHistory,
} from "@/lib/inventory-helpers"
import {
  loadSharedInventoryState,
  persistSharedInventoryState,
} from "@/lib/shared-state"
import { createId } from "@/lib/utils"
import { InventoryState, Member, UndoPayload } from "@/types/inventory"

type InventoryContextValue = {
  state: InventoryState
  isReady: boolean
  consumeByMember: (memberId: string, source?: "manual" | "qr") => Promise<void>
  restock: (quantity: number) => Promise<void>
  setCurrentStock: (targetStock: number) => Promise<void>
  setNextSubscriptionDate: (date: string | null) => Promise<void>
  addMember: (name: string) => Promise<void>
  updateMember: (memberId: string, name: string) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  undoLastAction: () => Promise<void>
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(INITIAL_INVENTORY_STATE)
  const [isReady, setIsReady] = useState(false)
  const undoStackRef = useRef<UndoPayload[]>([])
  const isSyncingRef = useRef(false)

  useEffect(() => {
    let alive = true

    async function bootstrap() {
      try {
        const loaded = await loadSharedInventoryState()
        if (!alive) return
        setState(loaded)
        setIsReady(true)
      } catch {
        toast.error("共有データの読み込みに失敗しました")
        if (!alive) return
        setState(INITIAL_INVENTORY_STATE)
        setIsReady(true)
      }
    }

    void bootstrap()

    const intervalId = window.setInterval(async () => {
      if (!alive || isSyncingRef.current) return
      try {
        const latest = await loadSharedInventoryState()
        if (!alive) return
        setState(latest)
      } catch {
        // noop
      }
    }, 4000)

    return () => {
      alive = false
      window.clearInterval(intervalId)
    }
  }, [])

  const pushUndoSnapshot = (previousState: InventoryState, label: string) => {
    undoStackRef.current.push({
      previousState: structuredClone(previousState),
      label,
    })

    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift()
    }
  }

  const saveSharedState = async (
    nextState: InventoryState,
    previousState?: InventoryState,
    undoLabel?: string
  ) => {
    if (previousState && undoLabel) {
      pushUndoSnapshot(previousState, undoLabel)
    }

    setState(nextState)
    isSyncingRef.current = true

    try {
      await persistSharedInventoryState(nextState)
    } catch {
      if (previousState) {
        setState(previousState)
      }
      toast.error("共有データの保存に失敗しました")
      throw new Error("save failed")
    } finally {
      isSyncingRef.current = false
    }
  }

  const showUndoToast = (message: string, description: string) => {
    toast.success(message, {
      description,
      action: {
        label: "元に戻す",
        onClick: () => {
          void undoLastAction()
        },
      },
    })
  }

  const undoLastAction = async () => {
    const latest = undoStackRef.current.pop()

    if (!latest) {
      toast.error("元に戻せる操作がありません")
      return
    }

    const current = state

    try {
      await saveSharedState(latest.previousState)
      toast("元に戻しました", {
        description: latest.label,
      })
    } catch {
      setState(current)
    }
  }

  const consumeByMember = async (memberId: string, source: "manual" | "qr" = "manual") => {
    const member = state.members.find((item) => item.id === memberId)

    if (!member) {
      toast.error("不正なQRまたは存在しないメンバーです")
      return
    }

    if (state.currentStock <= 0) {
      toast.error("在庫がありません")
      return
    }

    const nextHistory = createConsumeHistory({
      memberId: member.id,
      memberName: member.name,
      source,
    })

    const nextState: InventoryState = {
      ...state,
      currentStock: state.currentStock - 1,
      histories: [nextHistory, ...state.histories],
    }

    await saveSharedState(nextState, state, `${member.name}の消費記録を取り消し`)
    showUndoToast(
      "入力完了しました",
      `${member.name}が1本飲みました。残り${nextState.currentStock}本です`
    )
  }

  const restock = async (quantity: number) => {
    if (quantity <= 0) return

    const nextHistory = createRestockHistory(quantity)
    const nextState: InventoryState = {
      ...state,
      currentStock: state.currentStock + quantity,
      histories: [nextHistory, ...state.histories],
    }

    await saveSharedState(nextState, state, `補充${quantity}本を取り消し`)
    showUndoToast("補充しました", `${quantity}本追加しました。残り${nextState.currentStock}本です`)
  }

  const setCurrentStock = async (targetStock: number) => {
    if (!Number.isInteger(targetStock) || targetStock < 0) {
      toast.error("0以上の整数を入力してください")
      return
    }

    if (state.currentStock === targetStock) {
      toast("在庫数は変更されていません")
      return
    }

    const diff = targetStock - state.currentStock
    const adjustmentHistory =
      diff > 0
        ? createRestockHistory(diff)
        : {
            ...createConsumeHistory({
              memberId: "",
              memberName: "在庫調整",
              source: "manual",
              quantity: Math.abs(diff),
            }),
            memberId: undefined,
          }

    const nextState: InventoryState = {
      ...state,
      currentStock: targetStock,
      histories: [adjustmentHistory, ...state.histories],
    }

    await saveSharedState(nextState, state, "在庫数の直接修正を取り消し")
    showUndoToast("在庫数を修正しました", `現在の在庫数を${targetStock}本に変更しました`)
  }

  const setNextSubscriptionDate = async (date: string | null) => {
    const nextState: InventoryState = {
      ...state,
      nextSubscriptionDate: date,
    }

    await saveSharedState(nextState, state, "次回定期便日の変更を取り消し")
    toast.success("次回定期便日を更新しました", {
      description: date ? `${date} に設定しました` : "未設定にしました",
      action: {
        label: "元に戻す",
        onClick: () => {
          void undoLastAction()
        },
      },
    })
  }

  const addMember = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("メンバー名を入力してください")
      return
    }

    const nextMember: Member = {
      id: createId("member"),
      name: trimmed,
      createdAt: new Date().toISOString(),
    }

    const nextState: InventoryState = {
      ...state,
      members: [...state.members, nextMember],
    }

    await saveSharedState(nextState, state, `${trimmed}の追加を取り消し`)
    toast.success("メンバーを追加しました", {
      description: `${trimmed}を登録しました`,
      action: {
        label: "元に戻す",
        onClick: () => {
          void undoLastAction()
        },
      },
    })
  }

  const updateMember = async (memberId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("メンバー名を入力してください")
      return
    }

    const target = state.members.find((member) => member.id === memberId)
    if (!target) return

    const nextState: InventoryState = {
      ...state,
      members: state.members.map((member) =>
        member.id === memberId ? { ...member, name: trimmed } : member
      ),
      histories: state.histories.map((history) =>
        history.memberId === memberId ? { ...history, memberName: trimmed } : history
      ),
    }

    await saveSharedState(nextState, state, `${target.name}の名前変更を取り消し`)
    toast.success("メンバー名を更新しました", {
      description: `${target.name} → ${trimmed}`,
      action: {
        label: "元に戻す",
        onClick: () => {
          void undoLastAction()
        },
      },
    })
  }

  const removeMember = async (memberId: string) => {
    const target = state.members.find((member) => member.id === memberId)
    if (!target) return

    const nextState: InventoryState = {
      ...state,
      members: state.members.filter((member) => member.id !== memberId),
    }

    await saveSharedState(nextState, state, `${target.name}の削除を取り消し`)
    toast.success("メンバーを削除しました", {
      description: `${target.name}を削除しました。履歴は保持されます`,
      action: {
        label: "元に戻す",
        onClick: () => {
          void undoLastAction()
        },
      },
    })
  }

  const value = useMemo(
    () => ({
      state,
      isReady,
      consumeByMember,
      restock,
      setCurrentStock,
      setNextSubscriptionDate,
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