import { INITIAL_INVENTORY_STATE, STORAGE_KEY } from "@/lib/constants"
import { InventoryState } from "@/types/inventory"

export function loadInventoryState(): InventoryState {
  if (typeof window === "undefined") {
    return INITIAL_INVENTORY_STATE
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_INVENTORY_STATE

    const parsed = JSON.parse(raw) as InventoryState

    return {
      currentStock:
        typeof parsed.currentStock === "number"
          ? parsed.currentStock
          : INITIAL_INVENTORY_STATE.currentStock,
      histories: Array.isArray(parsed.histories) ? parsed.histories : [],
      members: Array.isArray(parsed.members) ? parsed.members : INITIAL_INVENTORY_STATE.members,
    }
  } catch {
    return INITIAL_INVENTORY_STATE
  }
}

export function saveInventoryState(state: InventoryState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}