"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  changeInventoryStock,
  DEFAULT_PRODUCT_ID,
  getInventoryStock,
} from "@/lib/inventory";

type UseSharedInventoryResult = {
  stock: number;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  consume: (amount?: number) => Promise<void>;
  replenish: (amount?: number) => Promise<void>;
  productId: string;
};

export function useSharedInventory(
  productId: string = DEFAULT_PRODUCT_ID
): UseSharedInventoryResult {
  const [stock, setStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const fetchStock = useCallback(async () => {
    if (!productId) {
      setError("NEXT_PUBLIC_DEFAULT_PRODUCT_ID が未設定です");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const latest = await getInventoryStock(productId);

      if (mountedRef.current) {
        setStock(latest);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "在庫取得でエラーが発生しました";
      if (mountedRef.current) {
        setError(message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [productId]);

  const refresh = useCallback(async () => {
    await fetchStock();
  }, [fetchStock]);

  const consume = useCallback(
    async (amount: number = 1) => {
      try {
        setError(null);
        setSyncing(true);
        const next = await changeInventoryStock(productId, -Math.abs(amount));
        if (mountedRef.current) {
          setStock(next);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "消費更新でエラーが発生しました";
        if (mountedRef.current) {
          setError(message);
        }
      } finally {
        if (mountedRef.current) {
          setSyncing(false);
        }
      }
    },
    [productId]
  );

  const replenish = useCallback(
    async (amount: number = 24) => {
      try {
        setError(null);
        setSyncing(true);
        const next = await changeInventoryStock(productId, Math.abs(amount));
        if (mountedRef.current) {
          setStock(next);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "補充更新でエラーが発生しました";
        if (mountedRef.current) {
          setError(message);
        }
      } finally {
        if (mountedRef.current) {
          setSyncing(false);
        }
      }
    },
    [productId]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchStock();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchStock]);

  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`inventory-realtime-${productId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory",
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          const nextStock = Number(
            (payload.new as { current_stock?: number } | null)?.current_stock ??
              (payload.old as { current_stock?: number } | null)?.current_stock ??
              0
          );
          setStock(nextStock);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  useEffect(() => {
    const onFocus = async () => {
      await fetchStock();
    };

    const onVisible = async () => {
      if (document.visibilityState === "visible") {
        await fetchStock();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchStock]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetchStock();
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchStock]);

  return useMemo(
    () => ({
      stock,
      loading,
      syncing,
      error,
      refresh,
      consume,
      replenish,
      productId,
    }),
    [stock, loading, syncing, error, refresh, consume, replenish, productId]
  );
}