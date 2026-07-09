# tabletop-initiative-mcp

Remote MCP server exposing Tabletop Initiative campaign data to Claude. Structured
read tools cover every collection; write tools are scoped to locations, templates,
notes, and items — the "AI authors into the app instead of Obsidian markdown" surface.
Images get a narrower slice: folder/label organization only, since this server has no
Firebase Storage access — uploading or generating art stays app-only.

Mirrors the hand-rolled JSON-RPC pattern from `GPA/mcp` (no MCP SDK dependency, a
single Vercel function), with one real difference: this server writes live
campaign data, so it authenticates with a Firebase Admin service account instead
of relying on public Firestore rules.

## Auth model

There's no login flow. Each campaign has a `meta.mcpKey` — a random secret the DM
generates from the campaign's DM view (the plug icon in the header). The full MCP
endpoint URL is `https://<domain>/api/mcp/<mcpKey>`. Every tool call resolves the
key to exactly one campaign and is hard-scoped to it — there's no tool that can
address a different campaign. Treat the URL like a password: anyone who has it can
read and write that campaign.

## Local setup

```bash
npm install
npm run typecheck
```

`npm run dev` runs `vercel dev`, which needs the project linked (see below) and
`FIREBASE_SERVICE_ACCOUNT_KEY` available locally — easiest is `vercel env pull`
after the env var is set in the Vercel dashboard.

## Deploying

1. **Service account.** In the Firebase console for the dnd project: Project
   Settings → Service Accounts → Generate new private key. This downloads a JSON
   file — keep it out of source control.
2. **Create/link the Vercel project.** From this directory:
   ```bash
   vercel link
   ```
   There's no pre-existing project to point at — this creates a new one the
   first time you run it (it'll prompt for a name; something like
   `tabletop-initiative-mcp` is fine).
3. **Set the env var.** In the Vercel dashboard (Settings → Environment
   Variables) for that project, add `FIREBASE_SERVICE_ACCOUNT_KEY` with the
   *entire contents* of the downloaded JSON file pasted as the value (this is the
   standard way to hand firebase-admin a service account on Vercel — the escaped
   `\n` sequences in `private_key` survive the paste since they're already part of
   the JSON text). Set it for Production (and Preview if you use preview
   deploys).
4. **Deploy.**
   ```bash
   vercel --prod
   ```
5. **Point the app at it.** In the main app's `.env.local`, set
   `VITE_MCP_BASE_URL` to the deployed URL (custom domain if you've set one up,
   otherwise the `*.vercel.app` URL Vercel gives you), then restart `npm run dev`
   so Vite picks it up.

No Firestore security rules changes are needed — the Admin SDK bypasses rules
entirely, and the `mcpKey` check in `lib/campaignAccess.ts` is the authorization
boundary.

## Adding it to Claude

In the app, open the plug icon in the DM view header, generate a key, and copy
the URL it shows. Add it as a remote MCP server — e.g. in Claude Code's
`.mcp.json`:

```json
{
  "mcpServers": {
    "tabletop-initiative": {
      "url": "https://<domain>/api/mcp/<mcpKey>"
    }
  }
}
```

or paste the same URL into a Claude.ai custom connector.
