import { Suspense } from "react";
import QrConsumeClient from "./qr-consume-client";

export const dynamic = "force-dynamic";

export default function QrConsumePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-10">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold">QR読み取り</h1>
            <p className="mt-3 text-sm text-gray-600">処理を開始しています...</p>
          </div>
        </main>
      }
    >
      <QrConsumeClient />
    </Suspense>
  );
}