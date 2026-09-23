'use client'

import { useRef } from 'react'

import type { LeadConfig } from '@/lib/lead'

import { LeadForm } from './LeadForm'
import { btnPrimary } from './ui'

export function CallbackButton({
  children = 'Заказать звонок',
  className = btnPrimary,
  config,
}: {
  children?: React.ReactNode
  className?: string
  config?: LeadConfig
}) {
  const ref = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>
        {children}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-[min(92vw,26rem)] rounded-2xl bg-card p-6 text-ink shadow-2xl backdrop:bg-ink/50"
      >
        <LeadForm config={config} onClose={() => ref.current?.close()} />
      </dialog>
    </>
  )
}
