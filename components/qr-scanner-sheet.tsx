"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, X } from "lucide-react"
import { toast } from "sonner"
import { useInventory } from "@/contexts/inventory-context"

type ScannerInstance = {
  start: (
    cameraConfig: { facingMode: string } | { deviceId: { exact: string } },
    config: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onFailure?: (errorMessage: string) => void
  ) => Promise<unknown>
  stop: () => Promise<unknown>
  clear: () => Promise<unknown>
}

export function QRScannerSheet() {
  const { consumeByMember, state } = useInventory()
  const [isOpen, setIsOpen] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [scanLock, setScanLock] = useState(false)
  const scannerRef = useRef<ScannerInstance | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      void cleanupScanner()
    }
  }, [])

  async function cleanupScanner() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => undefined)
        await scannerRef.current.clear().catch(() => undefined)
        scannerRef.current = null
      }
    } catch {
      // noop
    }
  }

  async function openScanner() {
    setIsOpen(true)
    setIsStarting(true)

    try {
      const module = await import("html5-qrcode")
      const Html5Qrcode = module.Html5Qrcode
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner as unknown as ScannerInstance

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText: string) => {
          if (scanLock) return

          setScanLock(true)

          try {
            const parsed = JSON.parse(decodedText) as { memberId?: string }

            if (!parsed.memberId) {
              toast.error("QRの内容が正しくありません")
            } else {
              const member = state.members.find((item) => item.id === parsed.memberId)

              if (!member) {
                toast.error("登録されていないメンバーのQRです")
              } else {
                consumeByMember(parsed.memberId, "qr")
              }
            }
          } catch {
            toast.error("QRの読み取りに失敗しました")
          }

          window.setTimeout(() => {
            if (mountedRef.current) {
              setScanLock(false)
            }
          }, 1500)
        },
        () => {
          // 読み取り失敗は無視
        }
      )
    } catch {
      toast.error("カメラを起動できませんでした")
      setIsOpen(false)
    } finally {
      if (mountedRef.current) {
        setIsStarting(false)
      }
    }
  }

  async function closeScanner() {
    await cleanupScanner()
    setIsOpen(false)
    setIsStarting(false)
    setScanLock(false)
  }

  return (
    <section className="card stack-gap">
      <div className="section-head">
        <div>
          <h2>QRで即登録</h2>
          <p>読み取り後、そのまま1本消費を記録します</p>
        </div>
      </div>

      {!isOpen ? (
        <button type="button" className="primary-button" onClick={openScanner}>
          <Camera size={18} />
          QRを読み取る
        </button>
      ) : (
        <div className="scanner-wrap">
          <div className="scanner-header">
            <span>{isStarting ? "カメラを準備中..." : "QRをカメラにかざしてください"}</span>
            <button type="button" className="icon-button" onClick={closeScanner} aria-label="閉じる">
              <X size={18} />
            </button>
          </div>

          <div id="qr-reader" className="qr-reader-box" />

          <p className="muted-text">
            連続読み取り防止のため、成功後は1.5秒だけ再読み取りを止めます。
          </p>
        </div>
      )}
    </section>
  )
}