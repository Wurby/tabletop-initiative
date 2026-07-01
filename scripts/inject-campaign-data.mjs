import { randomUUID as uuid } from 'crypto'
import { readFileSync } from 'fs'

const VAULT = '/Users/joshua/Library/Mobile Documents/iCloud~md~obsidian/Documents/vault/dnd'
function read(rel) { return readFileSync(`${VAULT}/${rel}`, 'utf8') }

// ─── helpers ──────────────────────────────────────────────────────────────────

function folder(name) { return { id: uuid(), name } }
function note(folderId, title, body) { return { id: uuid(), folderId, title, body } }

function makeTemplate({ name, hp, ac, type = 'mob', folderId, sections }) {
  const noteFolders = []
  const notes = []
  for (const [sectionName, items] of Object.entries(sections)) {
    if (!items.length) continue
    const f = folder(sectionName)
    noteFolders.push(f)
    for (const [title, body] of items) {
      notes.push(note(f.id, title, body))
    }
  }
  return { id: uuid(), name, hp: { max: hp }, ac, type, folderId, noteFolders, notes }
}

// ─── template folders ──────────────────────────────────────────────────────────

const fHumanoid = folder('Humanoid')
const fBeast = folder('Beast (Beacon)')
const fMonster = folder('Monster')

const templateFolders = [fHumanoid, fBeast, fMonster]

// ─── templates ────────────────────────────────────────────────────────────────

const templates = [

  // ── HUMANOID ────────────────────────────────────────────────────────────────

  makeTemplate({
    name: 'Bandit Captain', hp: 65, ac: 15, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Multiattack', '3 attacks: 2× Scimitar + 1× Dagger (melee), or 2× Dagger (ranged).'],
        ['Scimitar', 'Melee: +7 to hit, 5 ft. Hit: 6 (1d6+3) slashing.'],
        ['Dagger', 'Melee/Ranged: +5, 5 ft or 20/60 ft. Hit: 6 (1d4+3) piercing.'],
      ],
      'Features': [
        ['Cunning Action', 'Bonus action each turn: Dash, Disengage, or Hide.'],
      ],
      'Reactions': [
        ['Parry', 'Adds 2 AC against one melee attack. Must see attacker and wield melee weapon.'],
      ],
      'Tactics': [
        ['Behavior', 'Opens with a demand — uses hesitation to position flanking bandits. Targets squishiest PC. Uses Cunning Action to Disengage from dangerous melee fighters.'],
        ['Retreat', 'Below 20 HP: Disengages, retreats to cover, signals bandits to scatter. No loyalty to a losing cause.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Bandit Enforcer', hp: 19, ac: 14, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Longsword', 'Melee: +4 to hit, 5 ft. Hit: 6 (1d8+2) slashing.'],
        ['Shortbow', 'Ranged: +3, 80/320 ft. Hit: 4 (1d6+1) piercing.'],
      ],
      'Tactics': [
        ['Behavior', 'Positions to protect captain or hold chokepoint. Does not scatter when fight goes badly — holds until captain signals or falls. Will not stand down for anyone but the captain.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Bandit', hp: 11, ac: 12, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Scimitar', 'Melee: +3 to hit, 5 ft. Hit: 4 (1d6+1) slashing.'],
        ['Shortbow', 'Ranged: +3, 80/320 ft. Hit: 4 (1d6+1) piercing.'],
      ],
      'Tactics': [
        ['Behavior', 'Holds when winning; loses nerve fast when leader falls or odds shift. Will scatter, surrender, or run. No loyalty beyond the job.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Cultist Warlock Guard', hp: 45, ac: 14, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Longsword', 'Melee: +5 to hit, 5 ft. Hit: 7 (1d8+3) or 8 (1d10+3) two-handed.'],
        ['Fire Bolt (At Will)', 'Ranged spell: +5, 120 ft. Hit: 5 (1d10) fire. Ignites flammable objects.'],
        ['Ray of Frost (At Will)', 'Ranged spell: +5, 60 ft. Hit: 4 (1d8) cold. Speed -10 ft until start of warlock\'s next turn.'],
        ['Icy Inferno (Recharge 5-6)', '15-ft cone. DC 13 Dex save or 9 (2d8) cold + 9 (2d8) fire, half on success.'],
      ],
      'Spells (2×2nd slots)': [
        ['Armor of Agathys (2nd)', 'Action. 15 temp HP. Melee attackers take 15 cold damage while temp HP remain. Cast before combat if time allows.'],
        ['Scorching Ray (2nd)', '3 rays, +5 each, 120 ft. Each hit: 7 (2d6) fire. Can split targets.'],
        ['Hellish Rebuke (2nd, Reaction)', 'When damaged. DC 13 Dex save or 11 (2d10) fire, half on save.'],
        ['Misty Step (2nd, Bonus)', 'Teleport 30 ft to visible unoccupied space. Use to escape melee or reposition.'],
      ],
      'Features': [
        ['Mephistopheles\'s Aegis', '+2 bonus to AC (included). Sulfur smell, cold fire in eyes at close range.'],
        ['Infernal Pact', 'Cannot be charmed or frightened by non-magical means. Soul bound to Mephistopheles — fights to the death.'],
        ['Resistances', 'Resistant: Cold, Fire. Vulnerable: Radiant. Darkvision 60 ft.'],
      ],
      'Tactics': [
        ['Behavior', 'Open with Armor of Agathys if time. R1: Icy Inferno on grouped enemies, else Scorching Ray. Maintain distance, kite with Fire Bolt/Ray of Frost. Last Stand — soul already forfeit.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Eliza Brenner', hp: 78, ac: 14, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Repeating Wand (bonus, 1/short rest)', 'Scorching Ray: +8, 3 rays, each 2d6 fire.'],
        ['Toll the Dead (At Will)', 'DC 16 Con save or 2d8 necrotic (2d12 if target missing HP), 60 ft.'],
      ],
      'Spells (INT, save DC 16, +8 hit)': [
        ['Hypnotic Pattern (3rd, opener)', 'Concentration. DC 16 Wis or Incapacitated + speed 0 in 30-ft cube. Ends when takes damage or shaken. Immediately follow with Hold Person.'],
        ['Hold Person (2nd)', 'DC 16 Wis or Paralyzed. Concentration.'],
        ['Dominate Person (4th, last resort)', 'DC 16 Wis. Concentration up to 1 min.'],
        ['Counterspell (3rd)', 'Auto-counter ≤3rd level. Higher: +8 INT vs DC 10+level.'],
        ['Misty Step (2nd, bonus)', 'Teleport 30 ft if position untenable.'],
        ['Charm Person (1st)', 'DC 16 Wis. Charmed.'],
        ['Thunderwave (1st)', '15-ft cube. DC 16 Con: 2d8 thunder, half on save.'],
        ['Suggestion (2nd)', 'DC 16 Wis.'],
      ],
      'Tactics': [
        ['Priority', 'Spellcasters first, then anyone who\'s read her research.'],
        ['Opening', 'Hypnotic Pattern to divide party → Hold Person on most dangerous target → Scorching Ray wand as bonus while maintaining concentration.'],
        ['Retreat', 'Will not leave workshop while device intact. Uses device as cover. Does not surrender.'],
        ['Context', 'CR 7-8 if confronted. Former Crown scholar banished by Kerenor. Building a secret device (NOT a counterspell amplifier). Fischerei Artificiary.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Guard Soldier', hp: 5, ac: 12, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Longsword', '+2 to hit, 5 ft. 1d8 slashing (1d10 two-handed).'],
        ['Crossbow', '+2 to hit, 80/320 ft. 1d8 piercing.'],
      ],
      'Tactics': [
        ['Behavior', 'Forms lines, calls reinforcements, uses ranged from distance. Flees if alone and outnumbered.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Corrupt Guard', hp: 7, ac: 13, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Longsword', '+2 to hit, 5 ft. 1d8+1 slashing.'],
        ['Crossbow', '+3 to hit, 80/320 ft. 1d8+1 piercing.'],
      ],
      'Features': [
        ['Cunning Negotiator', 'Advantage on Insight and Deception involving deals or bribes.'],
      ],
      'Tactics': [
        ['Behavior', 'Attempts bribery before violence. Flees if offered enough gold or odds turn. Will betray employer for better opportunity. Bribable.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Reluctant Guard', hp: 6, ac: 12, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Longsword', '+2 to hit, 5 ft. 1d8 slashing.'],
        ['Crossbow', '+2 to hit, 80/320 ft. 1d8 piercing.'],
      ],
      'Features': [
        ['Reluctant Obedience', 'Disadvantage on saves vs charm effects promising escape or freedom.'],
      ],
      'Tactics': [
        ['Behavior', 'Follows orders without zealotry. May hesitate on moral issues. Sympathetic to appeals based on fairness. Unlikely to pursue if given an excuse. Potential ally.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Veteran Guard', hp: 16, ac: 14, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Longsword', '+3 to hit, 5 ft. 1d8+1 slashing (1d10+1 two-handed).'],
        ['Crossbow', '+3 to hit, 80/320 ft. 1d8+1 piercing.'],
      ],
      'Features': [
        ['Second Wind', 'Once per combat, bonus action: heal 1d10+1 HP.'],
        ['Parry', 'Reaction: reduce damage taken by 1d6+1. Requires weapon in hand.'],
      ],
      'Tactics': [
        ['Behavior', 'Leads guard formations. Tactical positioning, superior equipment. Calls reinforcements. Does not break formation easily.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Guard Captain', hp: 32, ac: 16, folderId: fHumanoid.id,
    sections: {
      'Attacks': [
        ['Longsword', '+4 to hit, 5 ft. 1d8+2 slashing (1d10+2 two-handed).'],
        ['Crossbow', '+3 to hit, 80/320 ft. 1d8+1 piercing.'],
      ],
      'Features': [
        ['Leadership (Recharge 5-6)', 'Bonus action: one ally within 30 ft can use reaction to make one weapon attack.'],
        ['Rally', 'On crit or reducing enemy to 0 HP: each ally within 30 ft gains advantage on next attack roll or saving throw.'],
        ['Parry', 'Reaction: reduce damage by 1d6+2. Requires weapon in hand.'],
      ],
      'Tactics': [
        ['Behavior', 'Commands from safe position. Uses crossbow, Leadership to enhance allies. Calls reinforcements. Surrenders only when no escape remains.'],
      ],
    },
  }),

  // ── BEAST (BEACON) ─────────────────────────────────────────────────────────

  makeTemplate({
    name: 'Beacon Bear', hp: 44, ac: 11, folderId: fBeast.id,
    sections: {
      'Attacks': [
        ['Multiattack', '1× Claws + 1× Bite.'],
        ['Claws', 'Melee: +7 to hit, 5 ft. Hit: 11 (2d6+5) slashing.'],
        ['Bite', 'Melee: +7 to hit, 5 ft. Hit: 9 (1d8+5) piercing.'],
      ],
      'Features': [
        ['Keen Smell', 'Advantage on Perception checks relying on smell.'],
        ['Beacon Silence', 'Produces no natural sound. Perception checks to hear it: disadvantage.'],
        ['Beacon Eyes', 'Eyes glow flat blue, visible in darkness up to 30 ft. Immune: Frightened.'],
      ],
      'Tactics': [
        ['Behavior', 'Targets largest or most armored creature. Closes in silence. Focuses one target until downed. Does not retreat.'],
        ['DM Note', 'CR 1 — Low danger for level 6 party. Escalation: second bear from treeline after 1 round if party lingers.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Beacon Giant Boar', hp: 57, ac: 12, folderId: fBeast.id,
    sections: {
      'Attacks': [
        ['Tusk', 'Melee: +5 to hit, 5 ft. Hit: 10 (2d6+3) piercing.'],
      ],
      'Features': [
        ['Charge', 'Move 20 ft toward target then Tusk: +2d6 piercing bonus damage. DC 13 Str save or knocked prone.'],
        ['Relentless (1/short rest)', 'If ≤10 damage would reduce to 0 HP, drops to 1 HP instead.'],
        ['Beacon Silence', 'No hoof falls, no snorting. Perception to hear: disadvantage.'],
        ['Beacon Eyes', 'Flat blue glow 30 ft. Immune: Frightened.'],
      ],
      'Tactics': [
        ['Behavior', 'Charges from max distance R1. Groups converge on same target before splitting. Does not scatter. Uses Relentless to absorb killing blow once.'],
        ['DM Note', '2-3 as street encounter in burning city. Silent boar charging through smoke before visible — unsettling opener.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Beacon Wolf', hp: 13, ac: 13, folderId: fBeast.id,
    sections: {
      'Attacks': [
        ['Bite', 'Melee: +4 to hit, 5 ft. Hit: 7 (2d4+2) piercing. DC 11 Str save or knocked prone.'],
      ],
      'Features': [
        ['Pack Tactics', 'Advantage on attacks if ally is within 5 ft of target and not incapacitated.'],
        ['Beacon Silence', 'No growling, no paw falls. Perception to hear: disadvantage.'],
        ['Beacon Eyes', 'Flat blue glow 30 ft. Immune: Frightened.'],
      ],
      'Tactics': [
        ['Behavior', 'Pack approaches in silent semicircle, charges simultaneously. Converges on single target until downed, then switches. Disengages only if pack ≤2 remaining.'],
        ['DM Note', 'Pack of 6-8. Total silence + glowing eyes in trees. Circle once, then charge.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Beacon Giant Elk', hp: 57, ac: 14, folderId: fBeast.id,
    sections: {
      'Attacks': [
        ['Multiattack', '1× Gore + 1× Hooves.'],
        ['Gore', 'Melee: +6 to hit, reach 10 ft. Hit: 11 (2d6+4) piercing.'],
        ['Hooves', 'Melee: +6 to hit, 5 ft. Hit: 22 (4d8+4) bludgeoning.'],
      ],
      'Features': [
        ['Charge', 'Move 20 ft toward target then Gore: +2d8 piercing bonus. DC 14 Str save or prone. If prone: bonus action Hooves on same target.'],
        ['Beacon Silence', 'No hoof falls, no bugling. Perception to hear: disadvantage. Speed 60 ft.'],
        ['Beacon Eyes', 'Flat blue glow 30 ft. Immune: Frightened.'],
      ],
      'Tactics': [
        ['Behavior', 'Charges most isolated party member first (60 ft speed = long charge range). Herd stampede through city streets = terrain hazard. Does not retreat.'],
        ['DM Note', '60 ft speed. Pair covers full city square in one turn. Players hear nothing until antlers are 10 ft away.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Beacon Polar Bear', hp: 42, ac: 15, folderId: fBeast.id,
    sections: {
      'Attacks': [
        ['Multiattack', '1× Bite + 1× Claws.'],
        ['Bite', 'Melee: +9 to hit, 5 ft. Hit: 11 (1d8+7) piercing.'],
        ['Claws', 'Melee: +9 to hit, 5 ft. Hit: 14 (2d6+7) slashing.'],
      ],
      'Features': [
        ['Keen Smell', 'Advantage on Perception checks relying on smell.'],
        ['Beacon Silence', 'No growling, no padding. Perception to hear: disadvantage. Swim 30 ft.'],
        ['Beacon Eyes', 'Flat blue glow 30 ft. Immune: Frightened.'],
      ],
      'Tactics': [
        ['Behavior', 'Silent approach, no warning before charge. Coordinates silently with paired bear — both attack same target. Does not retreat.'],
        ['DM Note', 'Suggested: 2 Polar Bears + Hendric Vassel at Duke\'s manor. STR 24 (+7), +9 to hit lands reliably on most ACs at level 7.'],
      ],
    },
  }),

  // ── MONSTER ─────────────────────────────────────────────────────────────────

  makeTemplate({
    name: 'Roper', hp: 93, ac: 20, folderId: fMonster.id,
    sections: {
      'Attacks': [
        ['Bite', 'Melee: +7 to hit, 5 ft. Hit: 22 (4d8+4) piercing.'],
        ['Reel (Bonus Action)', 'Pulls each grappled creature up to 25 ft straight toward roper.'],
      ],
      'Features': [
        ['False Appearance', 'While motionless: indistinguishable from cave formation (stalagmite).'],
        ['Grasping Tendrils', 'Up to 6 tendrils at once. Destroying a tendril deals no damage — roper extrudes replacement next turn. Break: DC 15 Str check (action).'],
        ['Spider Climb', 'Can climb any surface including ceilings, no check required.'],
      ],
      'Tactics': [
        ['Behavior', 'Holds motionless (ceiling ambush ideal) until targets within 50 ft. R1: each tendril grabs separate target. Reel all in, Bite closest threat. Reel every grappled creature each turn.'],
        ['Tendril Economy', 'Players burning actions on tendrils = action tax (roper regenerates them). Anything beyond 50 ft = safe. Body speed 10 ft = can\'t chase.'],
        ['See also', 'Roper Tendril stat block for T1-T6 initiative tracking.'],
      ],
    },
  }),

  makeTemplate({
    name: 'Roper Tendril', hp: 10, ac: 20, folderId: fMonster.id,
    sections: {
      'Attacks': [
        ['Tendril Grab (if not grappling)', 'Melee: +7 to hit, reach 50 ft. Hit: target Grappled (escape: Str check DC = 4) and Restrained. Disadvantage on Str checks and saves. Can\'t grab another while grappling.'],
        ['Squeeze (if grappling)', 'Melee: +7 to hit, 5 ft. Hit: 2d6+2.'],
      ],
      'Features': [
        ['Immunities', 'Psychic, Poison damage.'],
        ['Regeneration', 'Roper extrudes replacement tendril next turn when one is destroyed.'],
        ['Break Free', 'A creature can break a tendril: action, DC 15 Str check. No attack roll. No damage to roper.'],
      ],
      'Tactics': [
        ['Initiative', 'Run each tendril (T1-T6) on its own initiative slot.'],
      ],
    },
  }),
]

// ─── DM note folders ──────────────────────────────────────────────────────────

const nfLore = folder('Campaign Lore')
const nfNPCs = folder('Key NPCs')
const nfMeph = folder('Mephistopheles')

const dmNoteFolders = [nfLore, nfNPCs, nfMeph]

// ─── DM notes (full vault content) ───────────────────────────────────────────

const dmNotes = [

  // ── Campaign Lore ─────────────────────────────────────────────────────────

  note(nfLore.id, 'Campaign Reference', read('Campaign.md')),
  note(nfLore.id, 'Ethereal Creatures & Horrors', read('Codex/Enemies/Collection/Ethereal-Creatures-and-Horrors.md')),

  // ── Key NPCs ────────────────────────────────────────────────────────────────

  note(nfNPCs.id, 'Wizard King Kerenor', read('Codex/NPCs/Kerenor/Kerenor.md')),
  note(nfNPCs.id, 'Crown Prince Derenor', read('Codex/NPCs/Derenor/Derenor.md')),
  note(nfNPCs.id, 'Aldric Solen', read('Codex/NPCs/Aldric/Aldric.md')),
  note(nfNPCs.id, 'High Ritualist Malachai', read('Codex/Enemies/Humanoid/High-Ritualist-Malachai.md')),
  note(nfNPCs.id, 'Baron Gareth of Ostmarch', read('Codex/Enemies/Humanoid/Baron-Gareth.md')),

  // ── Mephistopheles ─────────────────────────────────────────────────────────

  note(nfMeph.id, 'Mephistopheles', read('Lore/Mephistopheles.md')),
]

// ─── call the Cloud Function ──────────────────────────────────────────────────

const FUNCTION_URL = 'https://us-central1-tabletop-initiative.cloudfunctions.net/adminInjectCampaignData'
const ADMIN_SECRET = '1Mmago0d3eg'
const CAMPAIGN_CODE = '8BHDWQ'

const payload = {
  data: {
    password: ADMIN_SECRET,
    campaignCode: CAMPAIGN_CODE,
    templates,
    templateFolders,
    dmNotes,
    dmNoteFolders,
  },
}

console.log(`Injecting ${templates.length} templates and ${dmNotes.length} DM notes into campaign ${CAMPAIGN_CODE}...`)

const res = await fetch(FUNCTION_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

const json = await res.json()

if (res.ok) {
  console.log('✓ Injection successful:', json.result)
} else {
  console.error('✗ Injection failed:', json)
  process.exit(1)
}
