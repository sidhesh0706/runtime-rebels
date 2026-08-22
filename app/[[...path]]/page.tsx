'use client'

import dynamic from 'next/dynamic'

const DayFlowApp = dynamic(() => import('../../src/App'), { ssr: false })

export default function DayFlowPage() {
  return <DayFlowApp />
}
