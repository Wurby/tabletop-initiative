import type { Campaign, Item, NamedFolder } from '../campaignAccess.js';
import { writeCampaign } from '../campaignAccess.js';

const ITEM_TYPES = ['weapon', 'armor', 'consumable', 'wondrous', 'gear', 'treasure', 'misc'] as const;
const RARITIES = ['common', 'uncommon', 'rare', 'very-rare', 'legendary', 'artifact'] as const;

function validateType(type: string | undefined): void {
  if (type !== undefined && !ITEM_TYPES.includes(type as (typeof ITEM_TYPES)[number])) {
    throw new Error(`Invalid type "${type}" — must be one of ${ITEM_TYPES.join(', ')}.`);
  }
}

function validateRarity(rarity: string | null | undefined): void {
  if (rarity != null && !RARITIES.includes(rarity as (typeof RARITIES)[number])) {
    throw new Error(`Invalid rarity "${rarity}" — must be one of ${RARITIES.join(', ')}, or omit/null for mundane.`);
  }
}

function clampOwnerIds(ownerIds: string[] | undefined, quantity: number, existing: string[]): string[] {
  const ids = ownerIds ?? existing;
  return ids.slice(0, Math.max(0, quantity));
}

export interface UpsertItemArgs {
  id?: string;
  name: string;
  type?: string;
  quantity?: number;
  value?: number;
  weight?: number;
  rarity?: string | null;
  attunement?: boolean;
  owner_ids?: string[];
  folder_id?: string | null;
  notes?: string;
}

export async function upsertItem(code: string, campaign: Campaign, args: UpsertItemArgs): Promise<string> {
  validateType(args.type);
  validateRarity(args.rarity);
  const items = campaign.items ?? [];

  if (args.id) {
    const existing = items.find((i) => i.id === args.id);
    if (!existing) throw new Error(`No item with id "${args.id}".`);
    const quantity = args.quantity ?? existing.quantity;
    const updated: Item = {
      ...existing,
      name: args.name ?? existing.name,
      type: (args.type ?? existing.type) as Item['type'],
      quantity,
      value: args.value ?? existing.value,
      weight: args.weight ?? existing.weight,
      rarity: (args.rarity !== undefined ? args.rarity : existing.rarity) as Item['rarity'],
      attunement: args.attunement ?? existing.attunement,
      ownerIds: clampOwnerIds(args.owner_ids, quantity, existing.ownerIds ?? []),
      folderId: args.folder_id !== undefined ? args.folder_id : existing.folderId,
      notes: args.notes ?? existing.notes,
    };
    const next = items.map((i) => (i.id === args.id ? updated : i));
    await writeCampaign(code, { items: next });
    return `Updated item "${updated.name}" (id: ${updated.id}).`;
  }

  const quantity = args.quantity ?? 1;
  const item: Item = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    name: args.name,
    type: (args.type ?? 'misc') as Item['type'],
    quantity,
    value: args.value ?? 0,
    weight: args.weight ?? 0,
    rarity: (args.rarity ?? null) as Item['rarity'],
    attunement: args.attunement ?? false,
    ownerIds: clampOwnerIds(args.owner_ids, quantity, []),
    folderId: args.folder_id ?? null,
    imageUrl: null,
    notes: args.notes ?? '',
  };
  await writeCampaign(code, { items: [...items, item] });
  return `Created item "${item.name}" (id: ${item.id}).`;
}

export async function deleteItem(code: string, campaign: Campaign, args: { id: string }): Promise<string> {
  const items = campaign.items ?? [];
  const existing = items.find((i) => i.id === args.id);
  if (!existing) throw new Error(`No item with id "${args.id}".`);
  await writeCampaign(code, { items: items.filter((i) => i.id !== args.id) });
  return `Deleted item "${existing.name}" (id: ${args.id}).`;
}

export interface UpsertItemFolderArgs {
  id?: string;
  name: string;
}

export async function upsertItemFolder(code: string, campaign: Campaign, args: UpsertItemFolderArgs): Promise<string> {
  const folders = campaign.itemFolders ?? [];

  if (args.id) {
    const existing = folders.find((f) => f.id === args.id);
    if (!existing) throw new Error(`No item folder with id "${args.id}".`);
    const updated = { ...existing, name: args.name ?? existing.name };
    await writeCampaign(code, { itemFolders: folders.map((f) => (f.id === args.id ? updated : f)) });
    return `Renamed item folder to "${updated.name}" (id: ${updated.id}).`;
  }

  const folder: NamedFolder = { id: crypto.randomUUID(), name: args.name };
  await writeCampaign(code, { itemFolders: [...folders, folder] });
  return `Created item folder "${folder.name}" (id: ${folder.id}).`;
}

export async function deleteItemFolder(code: string, campaign: Campaign, args: { id: string }): Promise<string> {
  const folders = campaign.itemFolders ?? [];
  const existing = folders.find((f) => f.id === args.id);
  if (!existing) throw new Error(`No item folder with id "${args.id}".`);
  const nextFolders = folders.filter((f) => f.id !== args.id);
  const items = campaign.items ?? [];
  const nextItems = items.map((i) => (i.folderId === args.id ? { ...i, folderId: null } : i));
  await writeCampaign(code, { itemFolders: nextFolders, items: nextItems });
  return `Deleted item folder "${existing.name}" (id: ${args.id}). Its items are now unfiled.`;
}
