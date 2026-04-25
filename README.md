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

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Backend | Firebase (Firestore, Auth, Storage) |
| Auth | Anonymous Firebase auth (no login required) |
| Real-time sync | Firestore `onSnapshot` |

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
