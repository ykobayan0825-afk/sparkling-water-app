"use client";

import StockControls from "@/components/StockControls";
import { useSharedInventory } from "@/hooks/useSharedInventory";

export default function HomePage() {
  const { stock, loading, syncing, error, refresh, consume, replenish, productId } =
    useSharedInventory();

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: 24,
        display: "grid",
        gap: 20,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>炭酸水管理アプリ</h1>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 20,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 14, color: "#666" }}>共有在庫</div>

        {loading ? (
          <div style={{ fontSize: 32, fontWeight: 700 }}>読み込み中...</div>
        ) : (
          <div style={{ fontSize: 48, fontWeight: 700 }}>{stock}本</div>
        )}

        <div style={{ fontSize: 12, color: "#666" }}>
          product_id: {productId || "未設定"}
        </div>

        {syncing && (
          <div style={{ fontSize: 13, color: "#666" }}>
            Supabase に反映中...
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#ffe9e9",
              color: "#b00020",
              padding: 12,
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={refresh} disabled={loading || syncing}>
            最新在庫を再取得
          </button>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 20,
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>在庫操作</h2>

        <StockControls
          disabled={loading || syncing}
          onConsume={consume}
          onReplenish={replenish}
        />
      </section>
    </main>
  );
}