'use client'

import Link from 'next/link'
import { useId, useState } from 'react'

import type { LeadConfig } from '@/lib/lead'

import { btnPrimary } from './ui'

type Status = 'idle' | 'sending' | 'done' | 'error'

export function LeadForm({ config, onClose }: { config?: LeadConfig; onClose?: () => void }) {
  const uid = useId()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          phone: form.get('phone'),
          consent: form.get('consent') === 'on',
          website: form.get('website'),
          config,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Не удалось отправить. Попробуйте ещё раз или позвоните нам.')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch {
      setError('Нет соединения. Попробуйте ещё раз или позвоните нам.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="py-4 text-center">
        <p className="font-serif text-3xl font-semibold">Спасибо!</p>
        <p className="mt-3 text-muted">Менеджер перезвонит в ближайшее время, уточнит детали и назовёт точную стоимость.</p>
        {onClose && (
          <button type="button" onClick={onClose} className={`${btnPrimary} mt-6`}>
            Закрыть
          </button>
        )}
      </div>
    )
  }

  const field =
    'mt-1 w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-base outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/30'

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="font-serif text-3xl font-semibold">Закажите звонок</p>
        <p className="mt-1 text-sm text-muted">Перезвоним, ответим на вопросы и рассчитаем точную стоимость.</p>
      </div>
      <div>
        <label htmlFor={`${uid}-name`} className="text-sm font-medium">
          Ваше имя
        </label>
        <input id={`${uid}-name`} name="name" required minLength={2} maxLength={80} autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor={`${uid}-phone`} className="text-sm font-medium">
          Телефон
        </label>
        <input
          id={`${uid}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          className={field}
        />
      </div>
      {/* Ловушка для ботов: люди это поле не видят */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-3 text-xs text-muted">
        <input name="consent" type="checkbox" required className="mt-0.5 size-4 accent-bronze" />
        <span>
          Согласен на обработку персональных данных согласно{' '}
          <Link href="/privacy" className="underline" target="_blank">
            политике конфиденциальности
          </Link>
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={status === 'sending'} className={`${btnPrimary} w-full disabled:opacity-60`}>
        {status === 'sending' ? 'Отправляем…' : 'Жду звонка'}
      </button>
    </form>
  )
}
