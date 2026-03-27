import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { InventoryProvider } from "@/contexts/inventory-context"
import { AppShell } from "@/components/app-shell"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "炭酸水在庫管理",
  description: "ワンタップとQRで素早く記録できる炭酸水在庫管理アプリ",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <InventoryProvider>
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-center" />
        </InventoryProvider>
      </body>
    </html>
  )
}