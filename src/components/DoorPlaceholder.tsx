/** Заглушка, пока у двери нет фотографии */
export function DoorPlaceholder({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" role="img" aria-label="Фото двери скоро появится" className={className}>
      <rect x="28" y="14" width="64" height="152" rx="2" fill="#efe8d3" stroke="#8a6a3b" strokeWidth="1.5" />
      <rect x="36" y="24" width="48" height="56" rx="1" fill="none" stroke="#8a6a3b" strokeOpacity=".5" />
      <rect x="36" y="90" width="48" height="66" rx="1" fill="none" stroke="#8a6a3b" strokeOpacity=".5" />
      <circle cx="82" cy="92" r="2.6" fill="#8a6a3b" />
    </svg>
  )
}
