export function buildPrompt(fields, reprompt, selectedNotes) {
  const lines = [
    `Generate a D&D 5e ${fields.type === 'ally' ? 'ally/NPC' : 'monster'} creature for a combat encounter.`,
  ]
  if (fields.name) lines.push(`Suggested name: ${fields.name}`)
  if (fields.cr) lines.push(`Challenge Rating: ${fields.cr}`)
  if (fields.attackStyle) lines.push(`Attack style: ${fields.attackStyle}`)
  if (fields.flying) lines.push(`Flying creature: yes`)
  if (fields.role) lines.push(`Combat role: ${fields.role}`)
  if (fields.behavior) lines.push(`Tactical behavior: ${fields.behavior}`)
  if (fields.freeform) lines.push(`Additional context: ${fields.freeform}`)
  if (selectedNotes.length > 0) {
    lines.push('\nDM campaign notes for context:')
    selectedNotes.forEach((n) => {
      lines.push(`  - ${n.title ? `${n.title}: ` : ''}${n.body}`)
    })
  }
  if (reprompt) lines.push(`\nAdjust the result: ${reprompt}`)
  lines.push(`
Return ONLY valid JSON (no markdown, no extra text):
{
  "name": "Creature Name",
  "type": "${fields.type}",
  "hp": { "max": 45 },
  "ac": 13,
  "noteFolders": [
    { "id": "attacks", "name": "Attacks" },
    { "id": "abilities", "name": "Abilities & Spells" }
  ],
  "notes": [
    { "id": "n1", "folderId": "attacks", "title": "Multiattack", "body": "Makes two melee weapon attacks per turn." },
    { "id": "n2", "folderId": "abilities", "title": "Poison Bite (Recharge 5–6)", "body": "Melee Weapon Attack: +5 to hit, 5 ft. Hit: 7 (1d8+3) piercing + 9 (2d8) poison. Con DC 13 or poisoned 1 hr." }
  ]
}

Use accurate 5e HP and AC for the CR. Include all attacks, abilities, and spells as separate concise notes. Each note must be usable at the table without any other references.`)
  return lines.join('\n')
}
