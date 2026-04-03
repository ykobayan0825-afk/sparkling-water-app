"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInventory } from "@/contexts/inventory-context";

export default function QrConsumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, consumeByMember } = useInventory();

  const memberId = searchParams.get("memberId");
  const [message, setMessage] = useState("処理を開始しています...");
  const [done, setDone] = useState(false);
  const hasProcessedRef = useRef(false);

  const memberName = useMemo(() => {
    if (!memberId) return null;
    return state.members.find((member) => member.id === memberId)?.name ?? null;
  }, [memberId, state.members]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (hasProcessedRef.current) {
        return;
      }
      hasProcessedRef.current = true;

      if (!memberId) {
        setMessage("memberId がありません。");
        setDone(true);
        return;
      }

      try {
        setMessage("重複チェック中です...");

        const dedupeRes = await fetch("/api/qr-dedupe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberId,
            windowSeconds: 5,
          }),
        });

        const dedupeData = await dedupeRes.json();

        if (!dedupeRes.ok || !dedupeData.ok) {
          if (!cancelled) {
            setMessage(dedupeData.message || "重複チェックに失敗しました。");
            setDone(true);
          }
          return;
        }

        if (!dedupeData.accepted) {
          if (!cancelled) {
            setMessage(dedupeData.message || "重複読み取りを防止しました。");
            setDone(true);
          }
          return;
        }

        setMessage("在庫を更新しています...");

        await consumeByMember(memberId, "qr");

        if (!cancelled) {
          setMessage(
            memberName
              ? `${memberName}さんの消費を記録しました。`
              : "消費を記録しました。"
          );
          setDone(true);

          setTimeout(() => {
            router.replace("/");
            router.refresh();
          }, 1200);
        }
      } catch (error) {
        console.error("[qr-consume-page] error:", error);

        if (!cancelled) {
          setMessage("記録処理に失敗しました。");
          setDone(true);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [memberId, consumeByMember, memberName, router]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-10">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">QR読み取り</h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>

        {memberName && (
          <p className="mt-2 text-sm text-gray-500">対象メンバー: {memberName}</p>
        )}

        {done && (
          <button
            type="button"
            onClick={() => {
              router.replace("/");
              router.refresh();
            }}
            className="mt-5 inline-flex rounded-lg border px-4 py-2 text-sm"
          >
            トップへ戻る
          </button>
        )}
      </div>
    </main>
  );
}