import { supabase } from "./supabase";

export type InventoryRow = {
  product_id: string;
  current_stock: number;
};

export const DEFAULT_PRODUCT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_ID || "";

if (!DEFAULT_PRODUCT_ID) {
  console.warn(
    "NEXT_PUBLIC_DEFAULT_PRODUCT_ID is not set. Shared inventory cannot work without it."
  );
}

export async function getInventoryStock(productId: string): Promise<number> {
  const { data, error } = await supabase
    .from("inventory")
    .select("product_id, current_stock")
    .eq("product_id", productId)
    .single();

  if (error) {
    throw new Error(`在庫取得に失敗しました: ${error.message}`);
  }

  return Number(data.current_stock ?? 0);
}

export async function setInventoryStock(
  productId: string,
  newStock: number
): Promise<number> {
  const safeStock = Math.max(0, Number(newStock) || 0);

  const { data, error } = await supabase
    .from("inventory")
    .update({ current_stock: safeStock })
    .eq("product_id", productId)
    .select("product_id, current_stock")
    .single();

  if (error) {
    throw new Error(`在庫更新に失敗しました: ${error.message}`);
  }

  return Number(data.current_stock ?? 0);
}

export async function changeInventoryStock(
  productId: string,
  delta: number
): Promise<number> {
  const current = await getInventoryStock(productId);
  const next = Math.max(0, current + delta);
  return await setInventoryStock(productId, next);
}