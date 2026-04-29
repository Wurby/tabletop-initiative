# Tabletop Initiative

A real-time D&D combat tracker with separate views for the DM and the table. Built to run on any device — DM manages the session, players watch it update live.

## Features

**DM View**

- Initiative tracker — add units (party, ally, mob), set HP/AC/initiative, track active turn and round count
- Per-unit controls — kill confirmation with CR-to-XP lookup, visibility toggle, death saves for party members
- Graveyard — killed units accumulate XP; bonus quest XP can be added manually
- Session clear — splits total XP across party, logs the session, and syncs a summary to the table
- Party modal — manage the party roster
- Session log — full history of past session clears with XP breakdowns

**Table View**

- Live initiative display — cards update in real-time as the DM makes changes
- Hidden unit support — units the DM marks hidden show as a placeholder, with active turn indicator still visible
- Graveyard display — read-only kill list with last session XP summary
- Session summary modal — pops up automatically when the DM ends a session; dismissed by the DM and closes on both sides simultaneously

## Tech Stack

| Layer          | Choice                                      |
| -------------- | ------------------------------------------- |
| Framework      | React 19                                    |
| Build          | Vite 6                                      |
| Styling        | Tailwind CSS v4                             |
| Backend        | Firebase (Firestore, Auth, Storage)         |
| Auth           | Anonymous Firebase auth (no login required) |
| Real-time sync | Firestore `onSnapshot`                      |

## Project Structure

```
src/
  components/
    initiative/       # Combat tracker and unit cards
    graveyard/        # Kill log and XP tracking
    session/          # Session summary and log modals
    party/            # Party roster modal
    icons.jsx
  views/
    DMView.jsx
    TableView.jsx
    JoinScreen.jsx
  lib/
    firebase.js
    xp.js             # CR-to-XP lookup table
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore, Authentication, and Storage enabled

### Installation

```bash
npm install
```

### Environment

Create a `.env.local` file in the project root:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Firebase Setup

1. Enable **Anonymous Authentication** in the Firebase console
2. Create a **Firestore** database
3. Set Firestore rules to allow authenticated reads/writes (anonymous auth counts)

### Admin Setup

The admin dashboard is accessed via a hidden button in the DM header (the faint `·` at the far right). It is protected by a server-side secret stored in **Google Cloud Secret Manager** — the password never touches the client bundle.

**One-time setup:**

1. Install the Firebase CLI and log in:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Set the admin secret (you'll be prompted to enter the password):
   ```bash
   firebase functions:secrets:set ADMIN_SECRET
   ```

3. Deploy the functions:
   ```bash
   cd functions && npm run deploy
   ```

**Optional — skip the password prompt locally:**

Add the password to `.env.local` and the dashboard will auto-authenticate when you open it:

```
VITE_ADMIN_SECRET=your-password-here
```

This is safe because `.env.local` is gitignored. Do not add it to `.env` or any committed file.

**To change the password later:**
```bash
firebase functions:secrets:set ADMIN_SECRET
firebase deploy --only functions
```

**What the admin dashboard does:**
- Lists all campaigns with their staleness (days since last DM activity) and lock status
- Lock/unlock campaigns — locked campaigns are never deleted by cleanup
- Run cleanup manually with a configurable age threshold
- Campaigns are also automatically cleaned up on the 1st of every month (any campaign with no DM activity in 30+ days that isn't locked is deleted — Firestore doc, Storage files, and the anonymous Auth user)

### Development

```bash
npm run dev
```

The dev server runs with `--host` so it's accessible on your local network — useful for testing the table view on a separate device.

### Build

```bash
npm run build
npm run preview
```

## Usage

1. Open the app and create a campaign (DM) or join one with a code (table)
2. DM adds units to initiative and manages the session
3. Table view connects with the same campaign code and updates live
4. At the end of a session, DM clicks **Clear** in the graveyard to split XP and log the session
