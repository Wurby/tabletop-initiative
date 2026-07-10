import type { Campaign, ImageEntry, NamedFolder } from '../campaignAccess.js';
import { writeCampaign } from '../campaignAccess.js';

// Images can't be created via MCP — no Firebase Storage access is configured for this
// server (see lib/firebaseAdmin.ts, which only wires up Firestore), and uploading or
// AI-generating art is a binary/file operation that belongs to the app's UI, not a
// text-based JSON-RPC tool. So this is a plain update (label/folder reassignment) on an
// existing image, not an upsert_X-style tool — `id` is required, there's no create path.
export interface UpdateImageArgs {
  id: string;
  label?: string;
  folder_id?: string | null;
}

export async function updateImage(code: string, campaign: Campaign, args: UpdateImageArgs): Promise<string> {
  const images = campaign.images ?? [];
  const existing = images.find((i) => i.id === args.id);
  if (!existing) throw new Error(`No image with id "${args.id}".`);
  const updated: ImageEntry = {
    ...existing,
    label: args.label ?? existing.label,
    folderId: args.folder_id !== undefined ? args.folder_id : existing.folderId,
  };
  await writeCampaign(code, { images: images.map((i) => (i.id === args.id ? updated : i)) });
  return `Updated image "${updated.label}" (id: ${updated.id}).`;
}

// Mirrors the app's clearImageReferences (src/lib/imageRefs.js) — the images/folders
// library is the single source of truth for image lifecycle, so deleting an entry here
// has to null out every reference to it, the same way the app's own delete does.
function clearImageReferences(campaign: Campaign, url: string): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  const locations = campaign.locations ?? [];
  let locationsChanged = false;
  const nextLocations = locations.map((loc) => {
    let nextLoc = loc;
    let changed = false;
    if (loc.imageUrl === url) {
      nextLoc = { ...nextLoc, imageUrl: null };
      changed = true;
    }
    const pois = loc.pois ?? [];
    if (pois.some((p) => p.imageUrl === url)) {
      nextLoc = { ...nextLoc, pois: pois.map((p) => (p.imageUrl === url ? { ...p, imageUrl: null } : p)) };
      changed = true;
    }
    if (changed) locationsChanged = true;
    return nextLoc;
  });
  if (locationsChanged) updates.locations = nextLocations;

  const items = campaign.items ?? [];
  if (items.some((i) => i.imageUrl === url)) {
    updates.items = items.map((i) => (i.imageUrl === url ? { ...i, imageUrl: null } : i));
  }

  const templates = campaign.templates ?? [];
  if (templates.some((t) => t.imageUrl === url)) {
    updates.templates = templates.map((t) => (t.imageUrl === url ? { ...t, imageUrl: null } : t));
  }

  const initiative = campaign.initiative ?? [];
  if (initiative.some((u) => u.imageUrl === url)) {
    updates.initiative = initiative.map((u) => (u.imageUrl === url ? { ...u, imageUrl: null } : u));
  }

  return updates;
}

export async function deleteImage(code: string, campaign: Campaign, args: { id: string }): Promise<string> {
  const images = campaign.images ?? [];
  const existing = images.find((i) => i.id === args.id);
  if (!existing) throw new Error(`No image with id "${args.id}".`);
  const nextImages = images.filter((i) => i.id !== args.id);
  const refUpdates = clearImageReferences(campaign, existing.url);
  await writeCampaign(code, { images: nextImages, ...refUpdates });
  return `Deleted image "${existing.label}" (id: ${args.id}) from the library and cleared every reference to it. Note: this server has no Firebase Storage access, so the underlying file was not removed — only the app's Image Library can do that.`;
}

export interface UpsertImageFolderArgs {
  id?: string;
  name: string;
}

export async function upsertImageFolder(code: string, campaign: Campaign, args: UpsertImageFolderArgs): Promise<string> {
  const folders = campaign.folders ?? [];

  if (args.id) {
    const existing = folders.find((f) => f.id === args.id);
    if (!existing) throw new Error(`No image folder with id "${args.id}".`);
    const updated = { ...existing, name: args.name ?? existing.name };
    await writeCampaign(code, { folders: folders.map((f) => (f.id === args.id ? updated : f)) });
    return `Renamed image folder to "${updated.name}" (id: ${updated.id}).`;
  }

  const folder: NamedFolder = { id: crypto.randomUUID(), name: args.name };
  await writeCampaign(code, { folders: [...folders, folder] });
  return `Created image folder "${folder.name}" (id: ${folder.id}).`;
}

export async function deleteImageFolder(code: string, campaign: Campaign, args: { id: string }): Promise<string> {
  const folders = campaign.folders ?? [];
  const existing = folders.find((f) => f.id === args.id);
  if (!existing) throw new Error(`No image folder with id "${args.id}".`);
  const nextFolders = folders.filter((f) => f.id !== args.id);
  const images = campaign.images ?? [];
  const nextImages = images.map((i) => (i.folderId === args.id ? { ...i, folderId: null } : i));
  await writeCampaign(code, { folders: nextFolders, images: nextImages });
  return `Deleted image folder "${existing.name}" (id: ${args.id}). Its images are now unfiled.`;
}
