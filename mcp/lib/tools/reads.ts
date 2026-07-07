import type { Campaign, SpellSlot } from '../campaignAccess.js';

function fmtNotes(notes: Campaign['dmNotes'], folders: Campaign['dmNoteFolders']): string {
  if (!notes || notes.length === 0) return '(no notes)';
  const folderName = (id: string | null) =>
    id ? (folders ?? []).find((f) => f.id === id)?.name ?? '(unknown folder)' : null;
  return notes
    .map((n) => {
      const folder = folderName(n.folderId);
      return `- [${n.id}] ${n.title || '(untitled)'}${folder ? ` (folder: ${folder})` : ''}`;
    })
    .join('\n');
}

export function getCampaignSummary(campaign: Campaign): string {
  const c = campaign.combat as { active?: boolean; round?: number } | undefined;
  const initiative = campaign.initiative ?? [];
  const clusters = campaign.locations ?? [];
  const poiCount = clusters.reduce((n, cl) => n + (cl.pois?.length ?? 0), 0);

  return [
    `**${campaign.meta.name}**`,
    '',
    `Combat: ${c?.active ? `active, round ${c.round ?? 1}` : 'not active'}`,
    `Units in initiative: ${initiative.length}`,
    `Graveyard: ${(campaign.graveyard ?? []).length}`,
    `Party members: ${(campaign.party ?? []).length}`,
    `Templates: ${(campaign.templates ?? []).length}`,
    `DM notes: ${(campaign.dmNotes ?? []).length}`,
    `Items: ${(campaign.items ?? []).length}`,
    `Locations: ${clusters.length} cluster${clusters.length !== 1 ? 's' : ''}, ${poiCount} POI${poiCount !== 1 ? 's' : ''}`,
    `Session logs: ${(campaign.sessionLogs ?? []).length}`,
  ].join('\n');
}

export function listLocations(campaign: Campaign): string {
  const clusters = campaign.locations ?? [];
  if (clusters.length === 0) return 'No locations yet.';
  return clusters
    .map((c) => {
      const pois = (c.pois ?? []).map((p) => `    - [${p.id}] ${p.letter} — ${p.name}`).join('\n');
      return `- [${c.id}] ${c.name} (${c.pois?.length ?? 0} POIs)\n${pois}`;
    })
    .join('\n');
}

export function getLocation(campaign: Campaign, args: { cluster_id: string; poi_id?: string }): string {
  const cluster = (campaign.locations ?? []).find((c) => c.id === args.cluster_id);
  if (!cluster) throw new Error(`No cluster with id "${args.cluster_id}".`);

  if (args.poi_id) {
    const poi = (cluster.pois ?? []).find((p) => p.id === args.poi_id);
    if (!poi) throw new Error(`No POI with id "${args.poi_id}" in cluster "${cluster.name}".`);
    return [
      `**${cluster.name} — ${poi.letter}: ${poi.name}** (poi_id: ${poi.id}, cluster_id: ${cluster.id})`,
      '',
      `Description: ${poi.description || '(empty)'}`,
      `Encounters: ${poi.encounters || '(empty)'}`,
      `What's Here: ${poi.whatIsHere || '(empty)'}`,
      `Who's Here: ${poi.whoIsHere || '(empty)'}`,
      `Quests: ${poi.quests || '(empty)'}`,
    ].join('\n');
  }

  const poiList = (cluster.pois ?? [])
    .map((p) => `  - [${p.id}] ${p.letter} — ${p.name}`)
    .join('\n');
  return [
    `**${cluster.name}** (cluster_id: ${cluster.id})`,
    '',
    `Arrival: ${cluster.arrival || '(empty)'}`,
    `Situation: ${cluster.situation || '(empty)'}`,
    `Plot Hooks: ${cluster.plotHooks || '(empty)'}`,
    '',
    `POIs:`,
    poiList || '  (none)',
  ].join('\n');
}

function fmtSpellSlots(slots: SpellSlot[] | undefined): string {
  const list = [...(slots ?? [])].sort((a, b) => a.level - b.level);
  if (list.length === 0) return '';
  return list.map((s) => `L${s.level}×${s.max}`).join(', ');
}

export function listTemplates(campaign: Campaign): string {
  const templates = campaign.templates ?? [];
  if (templates.length === 0) return 'No templates yet.';
  const folderName = (id: string | null) =>
    id ? (campaign.templateFolders ?? []).find((f) => f.id === id)?.name ?? null : null;
  return templates
    .map((t) => {
      const folder = folderName(t.folderId);
      const slots = fmtSpellSlots(t.spellSlots);
      return `- [${t.id}] ${t.name} (${t.type}, HP ${t.hp?.max ?? 0}, AC ${t.ac ?? 0})${folder ? ` — folder: ${folder}` : ''}${slots ? ` — slots: ${slots}` : ''}`;
    })
    .join('\n');
}

export function getTemplate(campaign: Campaign, args: { id: string }): string {
  const t = (campaign.templates ?? []).find((tpl) => tpl.id === args.id);
  if (!t) throw new Error(`No template with id "${args.id}".`);
  const slots = fmtSpellSlots(t.spellSlots);
  return [
    `**${t.name}** (id: ${t.id}, ${t.type})`,
    `HP: ${t.hp?.max ?? 0} | AC: ${t.ac ?? 0}`,
    `Spell slots: ${slots || '(none)'}`,
    '',
    'Notes:',
    fmtNotes(t.notes, t.noteFolders),
  ].join('\n');
}

export function listDmNotes(campaign: Campaign): string {
  return [
    'Folders:',
    (campaign.dmNoteFolders ?? []).map((f) => `- [${f.id}] ${f.name}`).join('\n') || '(none)',
    '',
    'Notes:',
    fmtNotes(campaign.dmNotes, campaign.dmNoteFolders),
  ].join('\n');
}

export function getDmNote(campaign: Campaign, args: { id: string }): string {
  const n = (campaign.dmNotes ?? []).find((note) => note.id === args.id);
  if (!n) throw new Error(`No DM note with id "${args.id}".`);
  return `**${n.title || '(untitled)'}** (id: ${n.id})\n\n${n.body}`;
}

export function listItems(campaign: Campaign): string {
  const items = campaign.items ?? [];
  if (items.length === 0) return 'No items yet.';
  const folderName = (id: string | null) =>
    id ? (campaign.itemFolders ?? []).find((f) => f.id === id)?.name ?? null : null;
  const ownerNames = (ids: string[]) =>
    ids
      .map((id) => (campaign.party ?? []).find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  return items
    .map((i) => {
      const folder = folderName(i.folderId);
      const owners = ownerNames(i.ownerIds ?? []);
      return [
        `- [${i.id}] ${i.name} (${i.type}, qty ${i.quantity}, ${i.value}gp, ${i.weight}lb`,
        i.rarity ? `, ${i.rarity}` : '',
        i.attunement ? ', attunement' : '',
        ')',
        folder ? ` — folder: ${folder}` : '',
        owners ? ` — owned by: ${owners}` : ' — unattached',
      ].join('');
    })
    .join('\n');
}

export function getItem(campaign: Campaign, args: { id: string }): string {
  const i = (campaign.items ?? []).find((item) => item.id === args.id);
  if (!i) throw new Error(`No item with id "${args.id}".`);
  const folder = i.folderId ? (campaign.itemFolders ?? []).find((f) => f.id === i.folderId)?.name : null;
  const owners = (i.ownerIds ?? [])
    .map((id) => (campaign.party ?? []).find((m) => m.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  return [
    `**${i.name}** (id: ${i.id}, ${i.type}${i.rarity ? `, ${i.rarity}` : ''})`,
    `Quantity: ${i.quantity} | Value: ${i.value}gp | Weight: ${i.weight}lb | Attunement: ${i.attunement ? 'yes' : 'no'}`,
    `Folder: ${folder ?? '(unfiled)'}`,
    `Owners: ${owners || '(unattached)'}`,
    '',
    i.notes || '(no notes)',
  ].join('\n');
}

export function listImages(campaign: Campaign): string {
  const images = campaign.images ?? [];
  if (images.length === 0) return 'No images yet.';
  const folderName = (id: string | null) =>
    id ? (campaign.folders ?? []).find((f) => f.id === id)?.name ?? null : null;
  return images
    .map((img) => {
      const folder = folderName(img.folderId);
      return `- [${img.id}] ${img.label || '(untitled)'}${folder ? ` (folder: ${folder})` : ''} — ${img.url}`;
    })
    .join('\n');
}

export function getParty(campaign: Campaign): string {
  const party = campaign.party ?? [];
  if (party.length === 0) return 'No party members yet.';
  return party.map((p) => `- [${p.id}] ${p.name} (${p.type}, HP ${p.hpMax}, AC ${p.ac})`).join('\n');
}

export function getInitiative(campaign: Campaign): string {
  const units = campaign.initiative ?? [];
  if (units.length === 0) return 'No units in initiative.';
  return units
    .map((u) => {
      const slots = [...(u.spellSlots ?? [])]
        .sort((a, b) => a.level - b.level)
        .map((s) => `L${s.level} ${s.used.filter(Boolean).length}/${s.max} used`)
        .join(', ');
      return `- [${u.id}] ${u.name} (init ${u.initiative}, HP ${u.hp?.current ?? 0}/${u.hp?.max ?? 0}, AC ${u.ac}, ${u.visible ? 'visible' : 'hidden'})${slots ? ` — slots: ${slots}` : ''}`;
    })
    .join('\n');
}

export function getGraveyard(campaign: Campaign): string {
  const graveyard = campaign.graveyard ?? [];
  if (graveyard.length === 0) return 'Graveyard is empty.';
  return graveyard.map((g) => `- ${g.name} (${g.xp} XP)`).join('\n');
}

export function getQuestXp(campaign: Campaign): string {
  const entries = campaign.questXp ?? [];
  if (entries.length === 0) return 'No quest XP awarded yet.';
  return entries.map((q) => `- ${q.label}: ${q.xp} XP`).join('\n');
}

export function listSessionLogs(campaign: Campaign): string {
  const logs = campaign.sessionLogs ?? [];
  if (logs.length === 0) return 'No session logs yet.';
  return JSON.stringify(logs, null, 2);
}
