import type { Campaign, Cluster, Poi } from '../campaignAccess.js';
import { writeCampaign } from '../campaignAccess.js';

function defaultGridCols(n: number): number {
  return Math.max(2, Math.ceil(Math.sqrt(n + 2)));
}

function nextPoiLetter(existing: Poi[]): string {
  const used = new Set(existing.map((p) => p.letter));
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    if (!used.has(letter)) return letter;
  }
  return String.fromCharCode(65 + existing.length);
}

export interface UpsertClusterArgs {
  campaign_code: string;
  id?: string;
  name: string;
  arrival?: string;
  situation?: string;
  plot_hooks?: string;
}

export async function upsertCluster(code: string, campaign: Campaign, args: UpsertClusterArgs): Promise<string> {
  const clusters = campaign.locations ?? [];

  if (args.id) {
    const existing = clusters.find((c) => c.id === args.id);
    if (!existing) throw new Error(`No cluster with id "${args.id}".`);
    const updated: Cluster = {
      ...existing,
      name: args.name ?? existing.name,
      arrival: args.arrival ?? existing.arrival,
      situation: args.situation ?? existing.situation,
      plotHooks: args.plot_hooks ?? existing.plotHooks,
    };
    const next = clusters.map((c) => (c.id === args.id ? updated : c));
    await writeCampaign(code, { locations: next });
    return `Updated cluster "${updated.name}" (id: ${updated.id}).`;
  }

  // Create — always seeded with a first POI, matching the app's own invariant
  // that no cluster can exist with just an INDEX.
  const cols = campaign.locationsGridCols ?? defaultGridCols(clusters.length);
  const cluster: Cluster = {
    id: crypto.randomUUID(),
    name: args.name,
    gridRow: Math.floor(clusters.length / cols),
    gridCol: clusters.length % cols,
    arrival: args.arrival ?? '',
    situation: args.situation ?? '',
    plotHooks: args.plot_hooks ?? '',
    poiGridRows: null,
    poiGridCols: null,
    pois: [
      {
        id: crypto.randomUUID(),
        letter: 'A',
        name: `${args.name} A`,
        gridRow: 0,
        gridCol: 0,
        description: '',
        encounters: '',
        whatIsHere: '',
        whoIsHere: '',
        quests: '',
      },
    ],
  };
  await writeCampaign(code, { locations: [...clusters, cluster] });
  return `Created cluster "${cluster.name}" (id: ${cluster.id}) with a starter POI (id: ${cluster.pois[0]!.id}). Use upsert_poi to fill it in or add more.`;
}

export async function deleteCluster(code: string, campaign: Campaign, args: { id: string }): Promise<string> {
  const clusters = campaign.locations ?? [];
  const existing = clusters.find((c) => c.id === args.id);
  if (!existing) throw new Error(`No cluster with id "${args.id}".`);
  await writeCampaign(code, { locations: clusters.filter((c) => c.id !== args.id) });
  return `Deleted cluster "${existing.name}" (id: ${args.id}).`;
}

export interface UpsertPoiArgs {
  cluster_id: string;
  id?: string;
  letter?: string;
  name: string;
  description?: string;
  encounters?: string;
  what_is_here?: string;
  who_is_here?: string;
  quests?: string;
}

export async function upsertPoi(code: string, campaign: Campaign, args: UpsertPoiArgs): Promise<string> {
  const clusters = campaign.locations ?? [];
  const cluster = clusters.find((c) => c.id === args.cluster_id);
  if (!cluster) throw new Error(`No cluster with id "${args.cluster_id}".`);
  const pois = cluster.pois ?? [];

  if (args.id) {
    const existing = pois.find((p) => p.id === args.id);
    if (!existing) throw new Error(`No POI with id "${args.id}" in cluster "${cluster.name}".`);
    const updated: Poi = {
      ...existing,
      name: args.name ?? existing.name,
      letter: args.letter ?? existing.letter,
      description: args.description ?? existing.description,
      encounters: args.encounters ?? existing.encounters,
      whatIsHere: args.what_is_here ?? existing.whatIsHere,
      whoIsHere: args.who_is_here ?? existing.whoIsHere,
      quests: args.quests ?? existing.quests,
    };
    const nextPois = pois.map((p) => (p.id === args.id ? updated : p));
    const nextClusters = clusters.map((c) => (c.id === cluster.id ? { ...c, pois: nextPois } : c));
    await writeCampaign(code, { locations: nextClusters });
    return `Updated POI "${updated.name}" (id: ${updated.id}) in cluster "${cluster.name}".`;
  }

  const cols = cluster.poiGridCols ?? Math.max(2, Math.ceil(Math.sqrt(pois.length + 3)));
  const poi: Poi = {
    id: crypto.randomUUID(),
    letter: args.letter ?? nextPoiLetter(pois),
    name: args.name,
    gridRow: Math.floor(pois.length / cols),
    gridCol: pois.length % cols,
    description: args.description ?? '',
    encounters: args.encounters ?? '',
    whatIsHere: args.what_is_here ?? '',
    whoIsHere: args.who_is_here ?? '',
    quests: args.quests ?? '',
  };
  const nextClusters = clusters.map((c) => (c.id === cluster.id ? { ...c, pois: [...pois, poi] } : c));
  await writeCampaign(code, { locations: nextClusters });
  return `Created POI "${poi.name}" (id: ${poi.id}) in cluster "${cluster.name}".`;
}

export async function deletePoi(code: string, campaign: Campaign, args: { cluster_id: string; id: string }): Promise<string> {
  const clusters = campaign.locations ?? [];
  const cluster = clusters.find((c) => c.id === args.cluster_id);
  if (!cluster) throw new Error(`No cluster with id "${args.cluster_id}".`);
  const poi = (cluster.pois ?? []).find((p) => p.id === args.id);
  if (!poi) throw new Error(`No POI with id "${args.id}" in cluster "${cluster.name}".`);
  const nextClusters = clusters.map((c) =>
    c.id === cluster.id ? { ...c, pois: (c.pois ?? []).filter((p) => p.id !== args.id) } : c
  );
  await writeCampaign(code, { locations: nextClusters });
  return `Deleted POI "${poi.name}" (id: ${args.id}) from cluster "${cluster.name}".`;
}
