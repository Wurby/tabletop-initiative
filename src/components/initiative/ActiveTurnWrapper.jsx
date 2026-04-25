const OUTLINE = { party: 'outline-brand-forest', ally: 'outline-brand-rivulet', mob: 'outline-brand-danger' }
const BAR_BG  = { party: 'bg-brand-forest',      ally: 'bg-brand-rivulet',      mob: 'bg-brand-danger'   }

export default function ActiveTurnWrapper({ isActive, type = 'mob', children }) {
  const outline = OUTLINE[type] ?? OUTLINE.mob
  const bar     = BAR_BG[type]  ?? BAR_BG.mob
  return (
    <div className={`relative flex-shrink-0 min-h-28 ${isActive ? `outline outline-4 ${outline} outline-offset-0` : ''}`}>
      {isActive && (
        <div className={`absolute bottom-[-10px] left-[-4px] right-[-4px] h-[2px] ${bar} z-10`} />
      )}
      {children}
    </div>
  )
}
