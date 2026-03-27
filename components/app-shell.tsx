"use client"

import Link from "next/link"
import { Package2, QrCode, BarChart3, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/", label: "ホーム", icon: Package2 },
  { href: "/graphs", label: "グラフ", icon: BarChart3 },
  { href: "/members", label: "メンバー", icon: Users },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="app-shell">
      <header className="top-header">
        <div>
          <p className="eyebrow">炭酸水 在庫管理</p>
          <h1 className="page-title">すぐ記録、あとで見返せる管理アプリ</h1>
        </div>
        <div className="header-badge">
          <QrCode size={18} />
          <span>QR対応</span>
        </div>
      </header>

      <main className="page-content">{children}</main>

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("bottom-nav-item", active && "bottom-nav-item-active")}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}