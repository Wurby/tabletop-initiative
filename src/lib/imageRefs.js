// Builds a partial campaign update that nulls out every reference to `url`
// across the domains that can hold an imageUrl — used when an image is
// deleted from the shared library so no entity is left pointing at a dead URL.
export function clearImageReferences(campaign, url) {
  const updates = {}

  const locations = campaign.locations ?? []
  let locationsChanged = false
  const nextLocations = locations.map((loc) => {
    let nextLoc = loc
    let changed = false
    if (loc.imageUrl === url) {
      nextLoc = { ...nextLoc, imageUrl: null }
      changed = true
    }
    const pois = loc.pois ?? []
    if (pois.some((p) => p.imageUrl === url)) {
      nextLoc = { ...nextLoc, pois: pois.map((p) => (p.imageUrl === url ? { ...p, imageUrl: null } : p)) }
      changed = true
    }
    if (changed) locationsChanged = true
    return nextLoc
  })
  if (locationsChanged) updates.locations = nextLocations

  const items = campaign.items ?? []
  if (items.some((i) => i.imageUrl === url)) {
    updates.items = items.map((i) => (i.imageUrl === url ? { ...i, imageUrl: null } : i))
  }

  const templates = campaign.templates ?? []
  if (templates.some((t) => t.imageUrl === url)) {
    updates.templates = templates.map((t) => (t.imageUrl === url ? { ...t, imageUrl: null } : t))
  }

  const initiative = campaign.initiative ?? []
  if (initiative.some((u) => u.imageUrl === url)) {
    updates.initiative = initiative.map((u) => (u.imageUrl === url ? { ...u, imageUrl: null } : u))
  }

  return updates
}
