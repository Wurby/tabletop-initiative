import type { Campaign, Template } from '../campaignAccess.js';
import { writeCampaign } from '../campaignAccess.js';

export interface UpsertTemplateArgs {
  id?: string;
  name: string;
  type?: 'mob' | 'ally';
  hp_max?: number;
  ac?: number;
  folder_id?: string | null;
}

function validateType(type: string | undefined): void {
  if (type !== undefined && type !== 'mob' && type !== 'ally') {
    throw new Error(`Invalid type "${type}" — must be "mob" or "ally".`);
  }
}

export async function upsertTemplate(code: string, campaign: Campaign, args: UpsertTemplateArgs): Promise<string> {
  validateType(args.type);
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
