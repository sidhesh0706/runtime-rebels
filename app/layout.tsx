import type { Metadata } from 'next'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'DayFlow — Every workday, perfectly aligned.',
  description: 'A people-first HR command center for attendance, leave, payroll, workforce insights, and smarter daily decisions.',
  openGraph: {
    title: 'DayFlow',
    description: 'Every workday, perfectly aligned.',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
