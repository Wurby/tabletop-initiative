const INDEX_INSTRUCTIONS = {
  arrival: 'Write a vivid arrival description for this D&D location — what travelers see, hear, and smell as they approach. Markdown. 2–4 paragraphs.',
  situation: 'Describe the current state of affairs at this location. What is happening right now? Any tension, activity, or notable circumstances? Markdown. 2–4 paragraphs.',
  plotHooks: 'Generate 3–5 specific, actionable plot hooks or rumors tied to this location. Each hook should be a story thread a DM can drop naturally. Markdown list.',
}

const POI_INSTRUCTIONS = {
  description: 'Write a vivid physical description of this point of interest — atmosphere, notable features, sensory details. Markdown. 1–3 paragraphs.',
  encounters: 'List 2–4 possible encounters at this POI: combat, social, and skill challenges. Be specific enough to run at the table. Markdown list.',
  whatIsHere: 'Describe the notable objects, items, structures, or features found here. Include interactive elements and potential loot. Markdown.',
  whoIsHere: 'Describe the NPCs, creatures, or factions present. Include names, brief motivations, and how they engage with players. Markdown.',
  quests: 'Generate 2–3 quests or objectives tied to this POI — hook, objective, and suggested reward. Markdown list.',
}

function indexContext(clusterDraft) {
  return [
    clusterDraft.name && `Location Name: ${clusterDraft.name}`,
    clusterDraft.arrival && `Arrival:\n${clusterDraft.arrival}`,
    clusterDraft.situation && `Situation:\n${clusterDraft.situation}`,
    clusterDraft.plotHooks && `Plot Hooks:\n${clusterDraft.plotHooks}`,
  ].filter(Boolean).join('\n\n')
}

function poiContext(poiDraft) {
  return [
    poiDraft.name && `POI Name: ${poiDraft.name}`,
    poiDraft.description && `Description:\n${poiDraft.description}`,
    poiDraft.encounters && `Encounters:\n${poiDraft.encounters}`,
    poiDraft.whatIsHere && `What's Here:\n${poiDraft.whatIsHere}`,
    poiDraft.whoIsHere && `Who's Here:\n${poiDraft.whoIsHere}`,
    poiDraft.quests && `Quests:\n${poiDraft.quests}`,
  ].filter(Boolean).join('\n\n')
}

function chatBlock(history, currentValue) {
  const turns = history.map(m =>
    m.role === 'user' ? `DM: ${m.content}` : `AI: ${m.content}`
  )
  const parts = []
  if (currentValue) parts.push(`CURRENT CONTENT:\n${currentValue}`)
  if (turns.length) parts.push(`CONVERSATION:\n${turns.join('\n\n')}`)
  return parts.join('\n\n')
}

function notesBlock(selectedNotes) {
  if (!selectedNotes?.length) return null
  const lines = selectedNotes.map(n => `  - ${n.title ? `${n.title}: ` : ''}${n.body}`)
  return `DM CAMPAIGN NOTES:\n${lines.join('\n')}`
}

export function buildIndexStepPrompt(step, clusterDraft, history, currentValue, userMessage, selectedNotes) {
  const ctx = indexContext(clusterDraft)
  const chat = chatBlock(history, currentValue)
  const instruction = INDEX_INSTRUCTIONS[step.key] ?? `Write the ${step.label} for this location.`

  return [
    'You are a creative D&D dungeon master assistant helping build a location index card.',
    ctx && `LOCATION CONTEXT:\n${ctx}`,
    notesBlock(selectedNotes),
    chat,
    `TASK: ${instruction}`,
    userMessage && `DM REQUEST: ${userMessage}`,
    'Respond with only the field content in Markdown. No preamble.',
  ].filter(Boolean).join('\n\n')
}

export function buildPoiStepPrompt(step, clusterDraft, poiDraft, history, currentValue, userMessage, selectedNotes) {
  const idxCtx = indexContext(clusterDraft)
  const pCtx = poiContext(poiDraft)
  const chat = chatBlock(history, currentValue)
  const instruction = POI_INSTRUCTIONS[step.key] ?? `Write the ${step.label} for this POI.`

  return [
    'You are a creative D&D dungeon master assistant helping build a location point of interest.',
    idxCtx && `LOCATION CONTEXT:\n${idxCtx}`,
    pCtx && `POI CONTEXT:\n${pCtx}`,
    notesBlock(selectedNotes),
    chat,
    `TASK: ${instruction}`,
    userMessage && `DM REQUEST: ${userMessage}`,
    'Respond with only the field content in Markdown. No preamble.',
  ].filter(Boolean).join('\n\n')
}

export function buildPoiNameSuggestionPrompt(clusterDraft, existingPois, selectedNotes) {
  const ctx = indexContext(clusterDraft)
  const existing = existingPois.map(p => `${p.letter}: ${p.name}`).join(', ')
  return [
    'You are a creative D&D dungeon master assistant.',
    ctx && `LOCATION CONTEXT:\n${ctx}`,
    existing && `EXISTING POIs: ${existing}`,
    notesBlock(selectedNotes),
    'Suggest a short, evocative name for the next point of interest at this location. Just the name — no explanation, no punctuation.',
  ].filter(Boolean).join('\n\n')
}
