import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: '炭酸水 在庫管理アプリ',
  description: '炭酸水の在庫・消費・発注目安を管理するアプリ',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '炭酸水在庫',
  },
  icons: {
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

