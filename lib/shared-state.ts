import { INITIAL_INVENTORY_STATE } from "@/lib/constants"
import { supabase } from "@/lib/supabase-browser"
import { InventoryState } from "@/types/inventory"

export async function loadSharedInventoryState(): Promise<InventoryState> {
  const { data: appStateRow, error: appStateError } = await supabase
    .from("app_state")
    .select("id, current_stock, next_subscription_date")
    .eq("id", "main")
    .maybeSingle()

  if (appStateError) {
    throw appStateError
  }

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, name, created_at")
    .order("created_at", { ascending: true })

  if (membersError) {
    throw membersError
  }

  const { data: histories, error: historiesError } = await supabase
    .from("histories")
    .select("id, type, quantity, member_id, member_name, source, timestamp")
    .order("timestamp", { ascending: false })

  if (historiesError) {
    throw historiesError
  }

  const hasAnyData = appStateRow || (members?.length ?? 0) > 0 || (histories?.length ?? 0) > 0

  if (!hasAnyData) {
    await persistSharedInventoryState(INITIAL_INVENTORY_STATE)
    return INITIAL_INVENTORY_STATE
  }

  return {
    currentStock: appStateRow?.current_stock ?? INITIAL_INVENTORY_STATE.currentStock,
    nextSubscriptionDate:
      appStateRow?.next_subscription_date ?? INITIAL_INVENTORY_STATE.nextSubscriptionDate,
    members:
      members?.map((member) => ({
        id: member.id,
        name: member.name,
        createdAt: member.created_at,
      })) ?? [],
    histories:
      histories?.map((history) => ({
        id: history.id,
        type: history.type,
        quantity: history.quantity,
        memberId: history.member_id ?? undefined,
        memberName: history.member_name ?? undefined,
        source: history.source,
        timestamp: history.timestamp,
      })) ?? [],
  }
}

export async function persistSharedInventoryState(state: InventoryState): Promise<void> {
  const { error: appStateError } = await supabase.from("app_state").upsert({
    id: "main",
    current_stock: state.currentStock,
    next_subscription_date: state.nextSubscriptionDate,
    updated_at: new Date().toISOString(),
  })

  if (appStateError) {
    throw appStateError
  }

  const { error: deleteMembersError } = await supabase
    .from("members")
    .delete()
    .neq("id", "__never_match__")

  if (deleteMembersError) {
    throw deleteMembersError
  }

  if (state.members.length > 0) {
    const { error: insertMembersError } = await supabase.from("members").insert(
      state.members.map((member) => ({
        id: member.id,
        name: member.name,
        created_at: member.createdAt,
      }))
    )

    if (insertMembersError) {
      throw insertMembersError
    }
  }

  const { error: deleteHistoriesError } = await supabase
    .from("histories")
    .delete()
    .neq("id", "__never_match__")

  if (deleteHistoriesError) {
    throw deleteHistoriesError
  }

  if (state.histories.length > 0) {
    const { error: insertHistoriesError } = await supabase.from("histories").insert(
      state.histories.map((history) => ({
        id: history.id,
        type: history.type,
        quantity: history.quantity,
        member_id: history.memberId ?? null,
        member_name: history.memberName ?? null,
        source: history.source,
        timestamp: history.timestamp,
      }))
    )

    if (insertHistoriesError) {
      throw insertHistoriesError
    }
  }
}