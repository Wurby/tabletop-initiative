import { EyeClosed } from '../icons'
import ActiveTurnWrapper from './ActiveTurnWrapper'

function headerColor(type) {
  if (type === 'party') return 'bg-brand-forest'
  if (type === 'follower')
    return 'bg-[linear-gradient(to_right,var(--color-brand-rivulet),var(--color-brand-forest))]'
  if (type === 'ally') return 'bg-brand-rivulet'
  return 'bg-brand-danger'
}

function healthState(current, max) {
  const pct = max > 0 ? current / max : 0
  if (pct > 0.75) return { color: 'bg-brand-forest' }
  if (pct > 0.5) return { color: 'bg-yellow-400' }
  if (pct > 0.25) return { color: 'bg-orange-400' }
  return { color: 'bg-brand-danger' }
}

function HealthBar({ current, max, temp = 0, showExact = false }) {
  const pct = max > 0 ? current / max : 0
  const { color } = healthState(current, max)

  if (!showExact) {
    const rawW = pct > 0.75 ? 100 : pct > 0.5 ? 75 : pct > 0.25 ? 50 : 25
    const tempW = temp > 0 ? Math.round((temp / (max || 1)) * 100) : 0
    const totalFilled = Math.min(100, rawW + tempW)
    const dispTemp = tempW > 0 ? Math.min(totalFilled, tempW) : 0
    const discreteW = totalFilled - dispTemp
    return (
      <div className="h-2 w-full bg-brand-mint flex">
        <div className={`h-2 ${color}`} style={{ width: `${discreteW}%` }} />
        {dispTemp > 0 && (
          <div className="h-2 bg-brand-rivulet/40" style={{ width: `${dispTemp}%` }} />
        )}
      </div>
    )
  }

  const hpW = Math.min(100, Math.round(pct * 100))
  const tempW = temp > 0 ? Math.round((temp / (max || 1)) * 100) : 0
  const totalFilled = Math.min(100, hpW + tempW)
  const dispTemp = tempW > 0 ? Math.min(totalFilled, tempW) : 0
  const dispHp = totalFilled - dispTemp
  return (
    <div className="h-2 w-full bg-brand-mint flex">
      <div className={`h-2 ${color} transition-all duration-500`} style={{ width: `${dispHp}%` }} />
      {dispTemp > 0 && (
        <div
          className="h-2 bg-brand-rivulet/40 transition-all duration-500"
          style={{ width: `${dispTemp}%` }}
        />
      )}
    </div>
  )
}

function DeathSavesDisplay({ unit }) {
  const saves = unit.deathSaves ?? { s: [false, false, false], f: [false, false, false] }
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex items-center gap-1.5">
        <span className="text-brand-forest text-xs font-normal w-3">✓</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 border ${saves.s[i] ? 'bg-brand-forest border-brand-forest' : 'border-brand-ink/30'}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-brand-danger text-xs font-normal w-3">✗</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 border ${saves.f[i] ? 'bg-brand-danger border-brand-danger' : 'border-brand-ink/30'}`}
          />
        ))}
      </div>
    </div>
  )
}

function Revealed({ show, children }) {
  return show ? children : <EyeClosed className="text-brand-ink opacity-30" size={12} />
}

export default function InitiativeList({ campaign }) {
  const units = [...(campaign.initiative ?? [])].sort((a, b) => b.initiative - a.initiative)
  const activeIndex = campaign.combat?.activeIndex ?? 0

  if (units.length === 0) {
    return (
      <p className="text-brand-ink opacity-40 font-light text-sm py-8 text-center">
        Waiting for combat…
      </p>
    )
  }

  return (
    <div className="flex flex-row flex-wrap justify-center gap-x-3 gap-y-4 pb-4 px-6">
      {units.map((unit, i) => {
        const active = i === activeIndex
        const isParty = unit.type === 'party'
        const isAlly = unit.type === 'ally'
        const isFollower = unit.type === 'follower'

        if (!unit.visible) {
          return (
            <ActiveTurnWrapper key={unit.id} isActive={active} type={unit.type}>
              <div className="w-48 h-full min-h-28 bg-brand-mint-dark shadow-card flex flex-col opacity-30">
                <div className="bg-brand-ink px-3 py-2 flex items-center justify-center">
                  <EyeClosed className="text-white" size={16} />
                </div>
                <div className="flex-1 flex items-center justify-center py-6">
                  <EyeClosed className="text-brand-ink" size={28} />
                </div>
              </div>
            </ActiveTurnWrapper>
          )
        }

        return (
          <ActiveTurnWrapper key={unit.id} isActive={active} type={unit.type}>
            <div className="w-48 h-full min-h-28 bg-brand-mint-dark shadow-card flex flex-col transition-all">
              {/* Header: name | AC | initiative */}
              <div className={`${headerColor(unit.type)} px-2 py-1.5 flex items-center gap-1.5`}>
                <span className="text-white font-normal text-sm flex-1 min-w-0 truncate">
                  {unit.name}
                </span>
                <span className="text-white/70 text-xs font-normal shrink-0 flex items-center gap-0.5">
                  <span className="text-white/50">AC</span>
                  {isParty || isAlly || isFollower || unit.showAc ? (
                    <span>{unit.ac}</span>
                  ) : (
                    <EyeClosed className="text-white/40" size={10} />
                  )}
                </span>
                <span className="shrink-0 ml-1 flex items-baseline gap-0.5">
                  <span className="text-white/50 text-xs">i</span>
                  <span className="text-white font-light text-lg">{unit.initiative}</span>
                </span>
                {active && <span className="text-white text-xs font-bold shrink-0">▶</span>}
              </div>

              <div className="px-3 py-3 flex-1 flex flex-col gap-2">
                {unit.status && (
                  <p className="text-brand-ink/60 text-xs font-normal">{unit.status}</p>
                )}
                {isParty && unit.showDeathSaves && <DeathSavesDisplay unit={unit} />}
              </div>

              {/* HP + health bar (mob/ally only) */}
              {!isParty && (
                <div className="mx-3 mb-3 relative border border-brand-ink/20 px-2 pt-4 pb-2">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-mint-dark text-brand-forest text-xs font-normal px-1 leading-none">
                    HP
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-center items-center">
                      <Revealed show={unit.showHp}>
                        {(unit.hp?.temp ?? 0) > 0
                          ? `${unit.hp?.current}+${unit.hp?.temp} / ${unit.hp?.max}`
                          : `${unit.hp?.current} / ${unit.hp?.max}`}
                      </Revealed>
                    </div>
                    <HealthBar
                      current={unit.hp?.current ?? 0}
                      max={unit.hp?.max ?? 1}
                      temp={unit.hp?.temp ?? 0}
                      showExact={unit.showHp}
                    />
                  </div>
                </div>
              )}
            </div>
          </ActiveTurnWrapper>
        )
      })}
    </div>
  )
}
