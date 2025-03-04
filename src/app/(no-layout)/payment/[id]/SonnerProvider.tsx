// src/app/(no-layout)/payment/[id]/SonnerProvider.tsx
"use client"

import { Toaster } from 'sonner'

export function SonnerProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  )
}