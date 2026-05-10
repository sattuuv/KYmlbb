import './globals.css'

export const metadata = {
  title: 'MLBB Counter Pro',
  description: 'Professional Mobile Legends: Bang Bang counter picker and strategy tool',
}

export default function RootLayout({
  children,
}: {
  children: any
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
