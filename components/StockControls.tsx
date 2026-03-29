"use client";

import { useState } from "react";

type Props = {
  disabled?: boolean;
  onConsume: (amount?: number) => Promise<void>;
  onReplenish: (amount?: number) => Promise<void>;
};

export default function StockControls({
  disabled = false,
  onConsume,
  onReplenish,
}: Props) {
  const [manualValue, setManualValue] = useState("");
  const [manualMode, setManualMode] = useState<"consume" | "replenish">(
    "replenish"
  );

  const handleManualSubmit = async () => {
    const amount = Number(manualValue);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("1以上の数字を入力してください");
      return;
    }

    if (manualMode === "consume") {
      await onConsume(amount);
    } else {
      await onReplenish(amount);
    }

    setManualValue("");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onConsume(1)} disabled={disabled}>
          -1本
        </button>
        <button onClick={() => onConsume(2)} disabled={disabled}>
          -2本
        </button>
        <button onClick={() => onReplenish(24)} disabled={disabled}>
          +24本
        </button>
        <button onClick={() => onReplenish(32)} disabled={disabled}>
          +32本
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={manualMode}
          onChange={(e) =>
            setManualMode(e.target.value as "consume" | "replenish")
          }
          disabled={disabled}
        >
          <option value="replenish">補充</option>
          <option value="consume">消費</option>
        </select>

        <input
          type="number"
          min="1"
          step="1"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder="手動入力"
          disabled={disabled}
        />

        <button onClick={handleManualSubmit} disabled={disabled}>
          実行
        </button>
      </div>
    </div>
  );
}