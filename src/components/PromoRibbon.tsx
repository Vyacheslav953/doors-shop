/** Красная диагональная лента «Акция» в правом верхнем углу фото. Родитель должен быть relative и overflow-hidden. */
export function PromoRibbon({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const lg = size === 'lg'
  return (
    <div
      className={`pointer-events-none absolute right-0 top-0 z-10 overflow-hidden ${lg ? 'size-32' : 'size-24'}`}
    >
      <span
        className={`absolute block rotate-45 bg-promo text-center font-bold uppercase text-white shadow-md ${
          lg
            ? 'right-[-46px] top-[26px] w-[180px] py-1.5 text-sm tracking-[0.25em]'
            : 'right-[-36px] top-[20px] w-[140px] py-1 text-[11px] tracking-[0.2em]'
        }`}
      >
        Акция
      </span>
    </div>
  )
}
