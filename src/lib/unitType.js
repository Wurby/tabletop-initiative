// 'follower' is a retired unit type, kept only as a permanent synonym for 'ally' —
// legacy campaigns may still have it stored (party roster entries, initiative units).
// Nothing writes 'follower' anymore; this is purely a read-time compatibility shim.
export const TYPE_HEADER = {
  party: 'bg-brand-forest',
  ally: 'bg-brand-rivulet',
  follower: 'bg-brand-rivulet',
  mob: 'bg-brand-danger',
}

export const TYPE_LABEL = {
  party: 'P',
  ally: 'A',
  follower: 'A',
  mob: 'M',
}

export const TYPE_CYCLE = { ally: 'mob', mob: 'ally' }

export function isAllyType(type) {
  return type === 'ally' || type === 'follower'
}
