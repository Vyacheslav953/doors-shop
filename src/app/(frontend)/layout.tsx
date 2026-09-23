import type { Metadata } from 'next'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import React from 'react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { MobileBar } from '@/components/MobileBar'
import { getSettings } from '@/lib/data'

import './styles.css'

const cormorant = Cormorant_Garamond({
  subsets: ['cyrillic', 'latin'],
  weight: ['300', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})
const manrope = Manrope({
  subsets: ['cyrillic', 'latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const dynamic = 'force-dynamic'

// На Render адрес сайта заранее неизвестен: RENDER_EXTERNAL_URL подставляет платформа сама
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Doors M — межкомнатные двери', template: '%s — Doors M' },
  description:
    'Межкомнатные двери с доставкой и монтажом. Подберите модель, рассчитайте стоимость и закажите звонок менеджера.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  return (
    <html lang="ru" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-screen pb-20 md:pb-0">
        <Header phone={settings.phone} workHours={settings.workHours} />
        <main>{children}</main>
        <Footer phone={settings.phone} workHours={settings.workHours} />
        <MobileBar phone={settings.phone} />
      </body>
    </html>
  )
}
