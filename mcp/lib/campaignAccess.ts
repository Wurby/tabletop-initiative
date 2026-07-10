import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from './firebaseAdmin.js';

// ── Campaign document shape (mirrors the app's AGENTS.md schema) ──────────────

export interface Campaign {
  meta: { name: string; dmUid: string; mcpKey?: string; locked?: boolean };
  combat?: Record<string, unknown>;
  initiative?: InitiativeUnit[];
  graveyard?: GraveyardEntry[];
  questXp?: QuestXpEntry[];
  images?: ImageEntry[];
  folders?: NamedFolder[];
  party?: PartyMember[];
  templates?: Template[];
  templateFolders?: NamedFolder[];
  dmNotes?: Note[];
  dmNoteFolders?: NamedFolder[];
  items?: Item[];
  itemFolders?: NamedFolder[];
  sessionLogs?: unknown[];
  locations?: Cluster[];
  locationsGridRows?: number;
  locationsGridCols?: number;
}

export interface NamedFolder {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  title?: string;
  body: string;
  folderId: string | null;
  createdAt: number;
}

export interface InitiativeUnit {
  id: string;
  name: string;
  initiative: number;
  hp: { current: number; max: number; temp: number };
  ac: number;
  type: string;
  visible: boolean;
  conditions?: string[];
  showSpellSlots?: boolean;
  spellSlots?: InitiativeSpellSlot[];
  imageUrl?: string | null;
  notes?: Note[];
  noteFolders?: NamedFolder[];
}

export interface GraveyardEntry {
  id: string;
  name: string;
  xp: number;
  killedAt: number;
}

export interface QuestXpEntry {
  id: string;
  label: string;
  xp: number;
  awardedAt: number;
}

export interface ImageEntry {
  id: string;
  url: string;
  storagePath?: string;
  label: string;
  folderId: string | null;
  uploadedAt: number;
}

export interface PartyMember {
  id: string;
  name: string;
  // 'follower' is retired — no longer created, kept only for legacy stored data.
  type: 'party' | 'follower';
  hpMax?: number;
  ac: number;
}

export interface SpellSlot {
  level: number;
  max: number;
}

export interface InitiativeSpellSlot extends SpellSlot {
  used: boolean[];
}

export interface Template {
  id: string;
  createdAt: number;
  name: string;
  type: 'mob' | 'ally';
  hp: { max: number };
  ac: number;
  folderId: string | null;
  imageUrl?: string | null;
  spellSlots?: SpellSlot[];
  noteFolders?: NamedFolder[];
  notes?: Note[];
}

export interface Item {
  id: string;
  createdAt: number;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'wondrous' | 'gear' | 'treasure' | 'misc';
  quantity: number;
  value: number;
  weight: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary' | 'artifact' | null;
  attunement: boolean;
  ownerIds: string[];
  folderId: string | null;
  imageUrl: string | null;
  notes: string;
}

export interface Poi {
  id: string;
  letter: string;
  name: string;
  gridRow: number;
  gridCol: number;
  description: string;
  encounters: string;
  whatIsHere: string;
  whoIsHere: string;
  quests: string;
  imageUrl?: string | null;
}

export interface Cluster {
  id: string;
  name: string;
  gridRow: number;
  gridCol: number;
  arrival: string;
  nightArrival?: string;
  situation: string;
  plotHooks: string;
  imageUrl?: string | null;
  poiGridRows?: number | null;
  poiGridCols?: number | null;
  pois: Poi[];
}

// ── Key resolution ──────────────────────────────────────────────────────────

export interface ResolvedCampaign {
  code: string;
  data: Campaign;
}

export async function resolveCampaign(mcpKey: string): Promise<ResolvedCampaign | null> {
  if (!mcpKey) return null;
  const db = getDb();
  const snap = await db.collection('campaigns').where('meta.mcpKey', '==', mcpKey).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { code: doc.id, data: doc.data() as Campaign };
}

export async function writeCampaign(code: string, fields: Record<string, unknown>): Promise<void> {
  const db = getDb();
  await db.doc(`campaigns/${code}`).update({
    ...fields,
    'meta.lastActiveAt': FieldValue.serverTimestamp(),
  });
}
