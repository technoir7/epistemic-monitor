import type { Metadata } from 'next'
import { VT323, Share_Tech_Mono } from 'next/font/google'
import './globals.css'

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
})

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-share',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Epistemic State Monitor',
  description: 'Probabilistic ontology engine — research interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${vt323.variable} ${shareTechMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
