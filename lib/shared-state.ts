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
  const { data: currentAppState, error: currentAppStateError } = await supabase
    .from("app_state")
    .select("id")
    .eq("id", "main")
    .maybeSingle()

  if (currentAppStateError) {
    throw currentAppStateError
  }

  if (currentAppState) {
    const { error: updateAppStateError } = await supabase
      .from("app_state")
      .update({
        current_stock: state.currentStock,
        next_subscription_date: state.nextSubscriptionDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "main")

    if (updateAppStateError) {
      throw updateAppStateError
    }
  } else {
    const { error: insertAppStateError } = await supabase.from("app_state").insert({
      id: "main",
      current_stock: state.currentStock,
      next_subscription_date: state.nextSubscriptionDate,
      updated_at: new Date().toISOString(),
    })

    if (insertAppStateError) {
      throw insertAppStateError
    }
  }

  const { data: existingMembers, error: existingMembersError } = await supabase
    .from("members")
    .select("id")

  if (existingMembersError) {
    throw existingMembersError
  }

  const nextMemberIds = new Set(state.members.map((member) => member.id))
  const existingMemberIds = new Set((existingMembers ?? []).map((member) => member.id))
  const memberIdsToDelete = [...existingMemberIds].filter((id) => !nextMemberIds.has(id))

  if (state.members.length > 0) {
    const { error: upsertMembersError } = await supabase.from("members").upsert(
      state.members.map((member) => ({
        id: member.id,
        name: member.name,
        created_at: member.createdAt,
      })),
      { onConflict: "id" }
    )

    if (upsertMembersError) {
      throw upsertMembersError
    }
  }

  if (memberIdsToDelete.length > 0) {
    const { error: deleteMembersError } = await supabase
      .from("members")
      .delete()
      .in("id", memberIdsToDelete)

    if (deleteMembersError) {
      throw deleteMembersError
    }
  }

  const { data: existingHistories, error: existingHistoriesError } = await supabase
    .from("histories")
    .select("id")

  if (existingHistoriesError) {
    throw existingHistoriesError
  }

  const nextHistoryIds = new Set(state.histories.map((history) => history.id))
  const existingHistoryIds = new Set((existingHistories ?? []).map((history) => history.id))
  const historyIdsToDelete = [...existingHistoryIds].filter((id) => !nextHistoryIds.has(id))

  if (state.histories.length > 0) {
    const { error: upsertHistoriesError } = await supabase.from("histories").upsert(
      state.histories.map((history) => ({
        id: history.id,
        type: history.type,
        quantity: history.quantity,
        member_id: history.memberId ?? null,
        member_name: history.memberName ?? null,
        source: history.source,
        timestamp: history.timestamp,
      })),
      { onConflict: "id" }
    )

    if (upsertHistoriesError) {
      throw upsertHistoriesError
    }
  }

  if (historyIdsToDelete.length > 0) {
    const { error: deleteHistoriesError } = await supabase
      .from("histories")
      .delete()
      .in("id", historyIdsToDelete)

    if (deleteHistoriesError) {
      throw deleteHistoriesError
    }
  }
}