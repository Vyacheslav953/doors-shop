import { telHref } from '@/lib/phone'

import { CallbackButton } from './CallbackButton'
import { btnGhost, btnPrimary } from './ui'

/** Закреплённая панель на телефонах: позвонить или заказать звонок */
export function MobileBar({ phone }: { phone: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-ivory/95 p-3 backdrop-blur sm:hidden">
      <a href={telHref(phone)} className={`${btnGhost} flex-1`}>
        Позвонить
      </a>
      <CallbackButton className={`${btnPrimary} flex-1`}>Заказать звонок</CallbackButton>
    </div>
  )
}
