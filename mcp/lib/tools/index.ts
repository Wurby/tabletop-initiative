import { resolveCampaign } from '../campaignAccess.js';
import {
  getCampaignSummary,
  listLocations,
  getLocation,
  listTemplates,
  getTemplate,
  listDmNotes,
  getDmNote,
  listItems,
  getItem,
  listImages,
  getParty,
  getInitiative,
  getGraveyard,
  getQuestXp,
  listSessionLogs,
} from './reads.js';
import { upsertCluster, deleteCluster, upsertPoi, deletePoi } from './locations.js';
import { upsertTemplate, deleteTemplate, upsertTemplateFolder, deleteTemplateFolder } from './templates.js';
import { upsertNote, deleteNote, upsertNoteFolder, deleteNoteFolder } from './notes.js';
import { upsertItem, deleteItem, upsertItemFolder, deleteItemFolder } from './items.js';
import { updateImage, deleteImage, upsertImageFolder, deleteImageFolder } from './images.js';

export interface ToolContent {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

const NOTE_SCOPE_PROPS = {
  scope: { type: 'string', enum: ['dm', 'template', 'unit'], description: 'Which notes to target: campaign-wide DM notes, a specific template\'s notes, or a specific initiative unit\'s notes.' },
  template_id: { type: 'string', description: 'Required when scope is "template" — the template\'s id.' },
  unit_id: { type: 'string', description: 'Required when scope is "unit" — the initiative unit\'s id from get_initiative.' },
};

const ITEM_TYPE_ENUM = ['weapon', 'armor', 'consumable', 'wondrous', 'gear', 'treasure', 'misc'];
const RARITY_ENUM = ['common', 'uncommon', 'rare', 'very-rare', 'legendary', 'artifact'];

export const TOOLS = [
  // ── Reads ──────────────────────────────────────────────────────────────────
  {
    name: 'get_campaign_summary',
    description: 'Overview of the campaign: combat state, and counts across initiative, graveyard, party, templates, notes, locations, and session logs.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_locations',
    description: 'List every cluster (top-level location) and its POIs, with ids, for browsing before fetching detail.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_location',
    description: 'Fetch full detail for a cluster (INDEX: arrival/situation/plot hooks + POI list), or a single POI within it if poi_id is given.',
    inputSchema: {
      type: 'object',
      properties: {
        cluster_id: { type: 'string', description: 'Cluster id from list_locations.' },
        poi_id: { type: 'string', description: 'Optional POI id from list_locations, to fetch just that POI.' },
      },
      required: ['cluster_id'],
    },
  },
  {
    name: 'list_templates',
    description: 'List every unit template (mob/ally) with id, type, HP, and AC.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_template',
    description: 'Fetch full detail for a template, including its notes.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Template id from list_templates.' } },
      required: ['id'],
    },
  },
  {
    name: 'list_dm_notes',
    description: 'List DM note folders and note titles (not full bodies) for browsing.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_dm_note',
    description: 'Fetch the full body of a single note — a campaign-wide DM note by default, or a specific template\'s note (scope: "template") or initiative unit\'s note (scope: "unit"). get_template and get_initiative only list note ids/titles, never bodies — this is how you fetch one. Existing calls with just `id` keep working unchanged, since scope defaults to "dm".',
    inputSchema: {
      type: 'object',
      properties: {
        ...NOTE_SCOPE_PROPS,
        id: { type: 'string', description: 'Note id from list_dm_notes, or from a template\'s Notes list in get_template.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_items',
    description: 'List every tracked item, with id, type, quantity, value, weight, rarity, attunement, folder, and owning party members.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_item',
    description: 'Fetch full detail for an item, including its notes body.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Item id from list_items.' } },
      required: ['id'],
    },
  },
  {
    name: 'list_images',
    description: 'List images in the campaign\'s image library, with id, label, folder, and URL.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_party',
    description: 'List party members with AC.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_initiative',
    description: 'List units currently in the initiative tracker, with HP, AC, visibility, and note ids/titles (use get_dm_note with scope: "unit" to fetch a note\'s full body).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_graveyard',
    description: 'List killed units and the XP they awarded.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_quest_xp',
    description: 'List quest XP awards.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_session_logs',
    description: 'List raw session log entries.',
    inputSchema: { type: 'object', properties: {} },
  },

  // ── Location writes ───────────────────────────────────────────────────────
  {
    name: 'upsert_cluster',
    description: 'Create a new cluster (top-level location) or update an existing one\'s INDEX fields (arrival/situation/plot hooks). Creating always seeds one starter POI, matching the app\'s own rule that a cluster can\'t exist with just an INDEX.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Omit to create a new cluster; provide to update an existing one.' },
        name: { type: 'string', description: 'Cluster name.' },
        arrival: { type: 'string', description: 'Arrival section (Markdown supported).' },
        situation: { type: 'string', description: 'Situation section (Markdown supported).' },
        plot_hooks: { type: 'string', description: 'Plot hooks section (Markdown supported).' },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_cluster',
    description: 'Delete a cluster and all of its POIs.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Cluster id.' } },
      required: ['id'],
    },
  },
  {
    name: 'upsert_poi',
    description: 'Create a new POI within a cluster, or update an existing POI\'s fields.',
    inputSchema: {
      type: 'object',
      properties: {
        cluster_id: { type: 'string', description: 'Cluster the POI belongs to.' },
        id: { type: 'string', description: 'Omit to create a new POI; provide to update an existing one.' },
        letter: { type: 'string', description: 'Single-letter POI marker, e.g. "B". Auto-assigned if omitted on create.' },
        name: { type: 'string', description: 'POI name.' },
        description: { type: 'string', description: 'Description section (Markdown supported).' },
        encounters: { type: 'string', description: 'Encounters section (Markdown supported).' },
        what_is_here: { type: 'string', description: '"What\'s Here" section — loot, features (Markdown supported).' },
        who_is_here: { type: 'string', description: '"Who\'s Here" section — NPCs, creatures (Markdown supported).' },
        quests: { type: 'string', description: 'Quests section (Markdown supported).' },
      },
      required: ['cluster_id', 'name'],
    },
  },
  {
    name: 'delete_poi',
    description: 'Delete a single POI from a cluster.',
    inputSchema: {
      type: 'object',
      properties: {
        cluster_id: { type: 'string', description: 'Cluster the POI belongs to.' },
        id: { type: 'string', description: 'POI id.' },
      },
      required: ['cluster_id', 'id'],
    },
  },

  // ── Template writes ──────────────────────────────────────────────────────
  {
    name: 'upsert_template',
    description: 'Create a new unit template or update an existing one. Does not touch its notes — use upsert_note with scope "template" for that.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Omit to create a new template; provide to update an existing one.' },
        name: { type: 'string' },
        type: { type: 'string', enum: ['mob', 'ally'] },
        hp_max: { type: 'number' },
        ac: { type: 'number' },
        folder_id: { type: 'string', description: 'Template folder id, or omit/null for unfiled.' },
        spell_slots: {
          type: 'array',
          description: 'Spell slot levels this template\'s casters have, config-only (no "used" state — that\'s tracked once cloned onto an initiative unit via "+ Init"). Replaces the full list when provided.',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number', description: 'Spell level, 1-9.' },
              max: { type: 'number', description: 'Number of slots at this level.' },
            },
            required: ['level', 'max'],
          },
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_template',
    description: 'Delete a unit template.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'upsert_template_folder',
    description: 'Create a new template folder or rename an existing one.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'delete_template_folder',
    description: 'Delete a template folder. Templates inside it become unfiled, not deleted.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Note writes ───────────────────────────────────────────────────────────
  {
    name: 'upsert_note',
    description: 'Create a new note or update an existing one, in campaign-wide DM notes, a specific template\'s notes, or a specific initiative unit\'s notes.',
    inputSchema: {
      type: 'object',
      properties: {
        ...NOTE_SCOPE_PROPS,
        id: { type: 'string', description: 'Omit to create a new note; provide to update an existing one.' },
        title: { type: 'string' },
        body: { type: 'string', description: 'Note body (Markdown supported).' },
        folder_id: { type: 'string', description: 'Note folder id, or omit/null for unfiled.' },
      },
      required: ['scope', 'body'],
    },
  },
  {
    name: 'delete_note',
    description: 'Delete a note.',
    inputSchema: {
      type: 'object',
      properties: { ...NOTE_SCOPE_PROPS, id: { type: 'string' } },
      required: ['scope', 'id'],
    },
  },
  {
    name: 'upsert_note_folder',
    description: 'Create a new note folder or rename an existing one.',
    inputSchema: {
      type: 'object',
      properties: { ...NOTE_SCOPE_PROPS, id: { type: 'string' }, name: { type: 'string' } },
      required: ['scope', 'name'],
    },
  },
  {
    name: 'delete_note_folder',
    description: 'Delete a note folder. Notes inside it become unfiled, not deleted.',
    inputSchema: {
      type: 'object',
      properties: { ...NOTE_SCOPE_PROPS, id: { type: 'string' } },
      required: ['scope', 'id'],
    },
  },

  // ── Item writes ───────────────────────────────────────────────────────────
  {
    name: 'upsert_item',
    description: 'Create a new tracked item or update an existing one.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Omit to create a new item; provide to update an existing one.' },
        name: { type: 'string' },
        type: { type: 'string', enum: ITEM_TYPE_ENUM },
        quantity: { type: 'number', description: 'Defaults to 1 on create.' },
        value: { type: 'number', description: 'Value in gold pieces.' },
        weight: { type: 'number', description: 'Weight in pounds.' },
        rarity: { type: 'string', enum: RARITY_ENUM, description: 'Omit or null for a mundane (non-magic) item.' },
        attunement: { type: 'boolean' },
        owner_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Party member ids holding this item. Capped at `quantity` — extra ids are dropped, not rejected.',
        },
        folder_id: { type: 'string', description: 'Item folder id, or omit/null for unfiled.' },
        notes: { type: 'string', description: 'Description/notes body (Markdown supported).' },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_item',
    description: 'Delete a tracked item.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'upsert_item_folder',
    description: 'Create a new item folder or rename an existing one.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'delete_item_folder',
    description: 'Delete an item folder. Items inside it become unfiled, not deleted.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ── Image writes ──────────────────────────────────────────────────────────
  {
    name: 'update_image',
    description: 'Update an existing image\'s label and/or folder (move it between folders, rename it). Images can\'t be created via MCP — uploading or AI-generating art goes through the app\'s UI, not this server. Requires an existing image id from list_images.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Image id from list_images.' },
        label: { type: 'string' },
        folder_id: { type: 'string', description: 'Image folder id, or omit/null for unfiled.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_image',
    description: 'Delete an image from the library and null out every reference to it (locations, POIs, items, templates, initiative units) — mirrors the app\'s own delete behavior. This server has no Firebase Storage access, so the underlying file is not removed, only the library entry and its references.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'upsert_image_folder',
    description: 'Create a new image folder or rename an existing one.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'delete_image_folder',
    description: 'Delete an image folder. Images inside it become unfiled, not deleted.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
];

function text(str: string): ToolContent {
  return { content: [{ type: 'text', text: str }] };
}

function errorText(str: string): ToolContent {
  return { content: [{ type: 'text', text: str }], isError: true };
}

export async function callTool(mcpKey: string, params: unknown): Promise<ToolContent> {
  const p = params as { name: string; arguments?: Record<string, unknown> };
  const args = (p.arguments ?? {}) as any;

  const resolved = await resolveCampaign(mcpKey);
  if (!resolved) return errorText('Invalid or expired MCP key. Generate a new connector URL from the DM view.');
  const { code, data: campaign } = resolved;

  try {
    switch (p.name) {
      case 'get_campaign_summary':
        return text(getCampaignSummary(campaign));
      case 'list_locations':
        return text(listLocations(campaign));
      case 'get_location':
        return text(getLocation(campaign, args));
      case 'list_templates':
        return text(listTemplates(campaign));
      case 'get_template':
        return text(getTemplate(campaign, args));
      case 'list_dm_notes':
        return text(listDmNotes(campaign));
      case 'get_dm_note':
        return text(getDmNote(campaign, args));
      case 'list_items':
        return text(listItems(campaign));
      case 'get_item':
        return text(getItem(campaign, args));
      case 'list_images':
        return text(listImages(campaign));
      case 'get_party':
        return text(getParty(campaign));
      case 'get_initiative':
        return text(getInitiative(campaign));
      case 'get_graveyard':
        return text(getGraveyard(campaign));
      case 'get_quest_xp':
        return text(getQuestXp(campaign));
      case 'list_session_logs':
        return text(listSessionLogs(campaign));

      case 'upsert_cluster':
        return text(await upsertCluster(code, campaign, { ...args, campaign_code: code }));
      case 'delete_cluster':
        return text(await deleteCluster(code, campaign, args));
      case 'upsert_poi':
        return text(await upsertPoi(code, campaign, args));
      case 'delete_poi':
        return text(await deletePoi(code, campaign, args));

      case 'upsert_template':
        return text(await upsertTemplate(code, campaign, args));
      case 'delete_template':
        return text(await deleteTemplate(code, campaign, args));
      case 'upsert_template_folder':
        return text(await upsertTemplateFolder(code, campaign, args));
      case 'delete_template_folder':
        return text(await deleteTemplateFolder(code, campaign, args));

      case 'upsert_note':
        return text(await upsertNote(code, campaign, args));
      case 'delete_note':
        return text(await deleteNote(code, campaign, args));
      case 'upsert_note_folder':
        return text(await upsertNoteFolder(code, campaign, args));
      case 'delete_note_folder':
        return text(await deleteNoteFolder(code, campaign, args));

      case 'upsert_item':
        return text(await upsertItem(code, campaign, args));
      case 'delete_item':
        return text(await deleteItem(code, campaign, args));
      case 'upsert_item_folder':
        return text(await upsertItemFolder(code, campaign, args));
      case 'delete_item_folder':
        return text(await deleteItemFolder(code, campaign, args));

      case 'update_image':
        return text(await updateImage(code, campaign, args));
      case 'delete_image':
        return text(await deleteImage(code, campaign, args));
      case 'upsert_image_folder':
        return text(await upsertImageFolder(code, campaign, args));
      case 'delete_image_folder':
        return text(await deleteImageFolder(code, campaign, args));

      default:
        return errorText(`Unknown tool: ${p.name}`);
    }
  } catch (err) {
    return errorText(err instanceof Error ? err.message : String(err));
  }
}
