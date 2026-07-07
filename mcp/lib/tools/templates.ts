import type { Campaign, NamedFolder, SpellSlot, Template } from '../campaignAccess.js';
import { writeCampaign } from '../campaignAccess.js';

export interface UpsertTemplateArgs {
  id?: string;
  name: string;
  type?: 'mob' | 'ally';
  hp_max?: number;
  ac?: number;
  folder_id?: string | null;
  spell_slots?: SpellSlot[];
}

function validateType(type: string | undefined): void {
  if (type !== undefined && type !== 'mob' && type !== 'ally') {
    throw new Error(`Invalid type "${type}" — must be "mob" or "ally".`);
  }
}

function validateSpellSlots(slots: SpellSlot[] | undefined): void {
  if (slots === undefined) return;
  for (const s of slots) {
    if (!Number.isInteger(s.level) || s.level < 1 || s.level > 9) {
      throw new Error(`Invalid spell slot level "${s.level}" — must be an integer 1-9.`);
    }
    if (!Number.isInteger(s.max) || s.max < 1) {
      throw new Error(`Invalid spell slot max "${s.max}" for level ${s.level} — must be a positive integer.`);
    }
  }
  const levels = slots.map((s) => s.level);
  if (new Set(levels).size !== levels.length) {
    throw new Error('Duplicate spell slot levels are not allowed — each level (1-9) may appear at most once.');
  }
}

export async function upsertTemplate(code: string, campaign: Campaign, args: UpsertTemplateArgs): Promise<string> {
  validateType(args.type);
  validateSpellSlots(args.spell_slots);
  const templates = campaign.templates ?? [];

  if (args.id) {
    const existing = templates.find((t) => t.id === args.id);
    if (!existing) throw new Error(`No template with id "${args.id}".`);
    const updated: Template = {
      ...existing,
      name: args.name ?? existing.name,
      type: args.type ?? existing.type,
      hp: { max: args.hp_max ?? existing.hp?.max ?? 0 },
      ac: args.ac ?? existing.ac,
      folderId: args.folder_id !== undefined ? args.folder_id : existing.folderId,
      spellSlots: args.spell_slots !== undefined ? args.spell_slots : existing.spellSlots,
    };
    const next = templates.map((t) => (t.id === args.id ? updated : t));
    await writeCampaign(code, { templates: next });
    return `Updated template "${updated.name}" (id: ${updated.id}).`;
  }

  const template: Template = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    name: args.name,
    type: args.type ?? 'mob',
    hp: { max: args.hp_max ?? 0 },
    ac: args.ac ?? 0,
    folderId: args.folder_id ?? null,
    spellSlots: args.spell_slots ?? [],
    noteFolders: [],
    notes: [],
  };
  await writeCampaign(code, { templates: [...templates, template] });
  return `Created template "${template.name}" (id: ${template.id}). Use upsert_note with scope "template" to add notes.`;
}

export async function deleteTemplate(code: string, campaign: Campaign, args: { id: string }): Promise<string> {
  const templates = campaign.templates ?? [];
  const existing = templates.find((t) => t.id === args.id);
  if (!existing) throw new Error(`No template with id "${args.id}".`);
  await writeCampaign(code, { templates: templates.filter((t) => t.id !== args.id) });
  return `Deleted template "${existing.name}" (id: ${args.id}).`;
}

export interface UpsertTemplateFolderArgs {
  id?: string;
  name: string;
}

export async function upsertTemplateFolder(code: string, campaign: Campaign, args: UpsertTemplateFolderArgs): Promise<string> {
  const folders = campaign.templateFolders ?? [];

  if (args.id) {
    const existing = folders.find((f) => f.id === args.id);
    if (!existing) throw new Error(`No template folder with id "${args.id}".`);
    const updated = { ...existing, name: args.name ?? existing.name };
    await writeCampaign(code, { templateFolders: folders.map((f) => (f.id === args.id ? updated : f)) });
    return `Renamed template folder to "${updated.name}" (id: ${updated.id}).`;
  }

  const folder: NamedFolder = { id: crypto.randomUUID(), name: args.name };
  await writeCampaign(code, { templateFolders: [...folders, folder] });
  return `Created template folder "${folder.name}" (id: ${folder.id}).`;
}

export async function deleteTemplateFolder(code: string, campaign: Campaign, args: { id: string }): Promise<string> {
  const folders = campaign.templateFolders ?? [];
  const existing = folders.find((f) => f.id === args.id);
  if (!existing) throw new Error(`No template folder with id "${args.id}".`);
  const nextFolders = folders.filter((f) => f.id !== args.id);
  const templates = campaign.templates ?? [];
  const nextTemplates = templates.map((t) => (t.folderId === args.id ? { ...t, folderId: null } : t));
  await writeCampaign(code, { templateFolders: nextFolders, templates: nextTemplates });
  return `Deleted template folder "${existing.name}" (id: ${args.id}). Its templates are now unfiled.`;
}
