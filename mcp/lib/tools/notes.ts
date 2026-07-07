import type { Campaign, NamedFolder, Note, Template } from '../campaignAccess.js';
import { writeCampaign } from '../campaignAccess.js';

export type NoteScope = 'dm' | 'template';

interface NoteTarget {
  label: string;
  notes: Note[];
  folders: NamedFolder[];
  writeBack: (notes: Note[], folders: NamedFolder[]) => Record<string, unknown>;
}

function resolveTarget(campaign: Campaign, scope: NoteScope, templateId?: string): NoteTarget {
  if (scope === 'dm') {
    return {
      label: 'DM notes',
      notes: campaign.dmNotes ?? [],
      folders: campaign.dmNoteFolders ?? [],
      writeBack: (notes, folders) => ({ dmNotes: notes, dmNoteFolders: folders }),
    };
  }

  if (!templateId) throw new Error('scope "template" requires template_id.');
  const templates = campaign.templates ?? [];
  const template = templates.find((t) => t.id === templateId);
  if (!template) throw new Error(`No template with id "${templateId}".`);

  return {
    label: `template "${template.name}"`,
    notes: template.notes ?? [],
    folders: template.noteFolders ?? [],
    writeBack: (notes, folders) => {
      const updated: Template = { ...template, notes, noteFolders: folders };
      return { templates: templates.map((t) => (t.id === templateId ? updated : t)) };
    },
  };
}

export interface UpsertNoteArgs {
  scope: NoteScope;
  template_id?: string;
  id?: string;
  title?: string;
  body: string;
  folder_id?: string | null;
}

export async function upsertNote(code: string, campaign: Campaign, args: UpsertNoteArgs): Promise<string> {
  const target = resolveTarget(campaign, args.scope, args.template_id);

  if (args.id) {
    const existing = target.notes.find((n) => n.id === args.id);
    if (!existing) throw new Error(`No note with id "${args.id}" in ${target.label}.`);
    const updated: Note = {
      ...existing,
      title: args.title ?? existing.title,
      body: args.body ?? existing.body,
      folderId: args.folder_id !== undefined ? args.folder_id : existing.folderId,
    };
    const nextNotes = target.notes.map((n) => (n.id === args.id ? updated : n));
    await writeCampaign(code, target.writeBack(nextNotes, target.folders));
    return `Updated note "${updated.title || '(untitled)'}" (id: ${updated.id}) in ${target.label}.`;
  }

  const note: Note = {
    id: crypto.randomUUID(),
    title: args.title ?? '',
    body: args.body,
    folderId: args.folder_id ?? null,
    createdAt: Date.now(),
  };
  await writeCampaign(code, target.writeBack([...target.notes, note], target.folders));
  return `Created note "${note.title || '(untitled)'}" (id: ${note.id}) in ${target.label}.`;
}

export async function deleteNote(
  code: string,
  campaign: Campaign,
  args: { scope: NoteScope; template_id?: string; id: string }
): Promise<string> {
  const target = resolveTarget(campaign, args.scope, args.template_id);
  const existing = target.notes.find((n) => n.id === args.id);
  if (!existing) throw new Error(`No note with id "${args.id}" in ${target.label}.`);
  const nextNotes = target.notes.filter((n) => n.id !== args.id);
  await writeCampaign(code, target.writeBack(nextNotes, target.folders));
  return `Deleted note "${existing.title || '(untitled)'}" (id: ${args.id}) from ${target.label}.`;
}

export interface UpsertNoteFolderArgs {
  scope: NoteScope;
  template_id?: string;
  id?: string;
  name: string;
}

export async function upsertNoteFolder(code: string, campaign: Campaign, args: UpsertNoteFolderArgs): Promise<string> {
  const target = resolveTarget(campaign, args.scope, args.template_id);

  if (args.id) {
    const existing = target.folders.find((f) => f.id === args.id);
    if (!existing) throw new Error(`No note folder with id "${args.id}" in ${target.label}.`);
    const updated = { ...existing, name: args.name ?? existing.name };
    const nextFolders = target.folders.map((f) => (f.id === args.id ? updated : f));
    await writeCampaign(code, target.writeBack(target.notes, nextFolders));
    return `Renamed note folder to "${updated.name}" (id: ${updated.id}) in ${target.label}.`;
  }

  const folder: NamedFolder = { id: crypto.randomUUID(), name: args.name };
  await writeCampaign(code, target.writeBack(target.notes, [...target.folders, folder]));
  return `Created note folder "${folder.name}" (id: ${folder.id}) in ${target.label}.`;
}

export async function deleteNoteFolder(
  code: string,
  campaign: Campaign,
  args: { scope: NoteScope; template_id?: string; id: string }
): Promise<string> {
  const target = resolveTarget(campaign, args.scope, args.template_id);
  const existing = target.folders.find((f) => f.id === args.id);
  if (!existing) throw new Error(`No note folder with id "${args.id}" in ${target.label}.`);
  const nextFolders = target.folders.filter((f) => f.id !== args.id);
  const nextNotes = target.notes.map((n) => (n.folderId === args.id ? { ...n, folderId: null } : n));
  await writeCampaign(code, target.writeBack(nextNotes, nextFolders));
  return `Deleted note folder "${existing.name}" (id: ${args.id}) from ${target.label}. Its notes are now unfiled.`;
}
