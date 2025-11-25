import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smokava - اسموکاوا',
  description: 'Shisha package sharing app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-dark-400 text-white font-sans antialiased">{children}</body>
    </html>
  )
}
