import type { Metadata } from 'next'
import './globals.css'
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation'

// Get title from environment variable for eNAMAD verification
const getTitle = (): string => {
  return process.env.NEXT_PUBLIC_ENAMAD_TITLE_OVERRIDE || 'Smokava - اسموکاوا'
}

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_ENAMAD_TITLE_OVERRIDE || 'Smokava - اسموکاوا',
  description: 'Shisha package sharing app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get eNAMAD meta code from environment variable
  const enamadMetaCode = process.env.NEXT_PUBLIC_ENAMAD_META_CODE

  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {enamadMetaCode && <meta name="enamad" content={enamadMetaCode} />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="text-white font-sans antialiased relative min-h-screen">
        <SmokeBackground smokeColor="#ff6b35" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
