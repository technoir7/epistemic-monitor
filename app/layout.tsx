import type { Metadata } from 'next'
import { VT323, Share_Tech_Mono } from 'next/font/google'
import './globals.css'

// Sent fresh on every visit: a page saved to a phone's Home Screen otherwise keeps
// showing an old build. The page is only a small shell, since the data loads separately.
export const dynamic = 'force-dynamic'

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
