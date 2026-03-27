import { InventoryState } from "@/types/inventory"

export const STORAGE_KEY = "sparkling-water-inventory-v2"

export const DEFAULT_STOCK = 24

export const DEFAULT_MEMBERS = [
  {
    id: "member-yuto",
    name: "悠人",
    createdAt: new Date().toISOString(),
  },
  {
    id: "member-fumiya",
    name: "史也",
    createdAt: new Date().toISOString(),
  },
  {
    id: "member-chiaki",
    name: "千秋",
    createdAt: new Date().toISOString(),
  },
]

export const INITIAL_INVENTORY_STATE: InventoryState = {
  currentStock: DEFAULT_STOCK,
  histories: [],
  members: DEFAULT_MEMBERS,
  nextSubscriptionDate: null,
}