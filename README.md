# 🐉 Adventure Tracker

A lightweight, browser-based checklist and inventory tracker built for gamers. Originally made for **Dragon Nest SEA**, but works for any game — or really anything — where you need to track recurring tasks, multiple characters/accounts, and item counts.

> Whether you're clearing weekly raids in an MMO, tracking dailies in a gacha game, or just managing a personal to-do list with resets — Adventure Tracker has you covered.

## Features

- **Checklist activities** — track recurring tasks per entry with checkboxes (Weekly, Daily, or One-time)
- **Counter activities** — track item/ticket counts with +/− buttons; great for consumables, currencies, or inventory
- **Auto-reset** — weekly activities reset automatically every Saturday at 9:00 AM PH time (UTC+8); daily activities reset every day at 9:00 AM PH time
- **Persistent saves** — all progress is saved to your browser's localStorage and survives page reloads
- **Grid layout** — cards are displayed in a responsive grid so you can see everything at a glance
- **Drag to reorder** — drag the ⠿⠿ handle on any card to rearrange the layout to your liking
- **Collapsible cards** — click a card header to fold it up and save screen space
- **Per-section controls** — quickly check all or uncheck all entries in a section
- **Color-coded cards** — assign a color accent to each activity for easy visual separation
- **Fully offline** — single HTML file, no server, backend, or account required

## Use Cases

Adventure Tracker is flexible enough for any game or workflow:

| Example Use Case | How |
|---|---|
| MMO weekly dungeon clears | Checklist (Weekly) — one entry per character |
| Gacha game daily quests | Checklist (Daily) — one entry per account |
| One-time progression goals | Checklist (One-time) — never auto-resets |
| Nest/raid entry tickets | Counter — tap + when you receive one, − when you use it |
| In-game currency or consumables | Counter — keep a running tally |
| Personal habit tracking | Checklist (Daily) — works outside games too |

### Dragon Nest SEA — Default Setup

The tracker comes pre-loaded with a Dragon Nest SEA configuration as an example:

| Activity | Type |
|---|---|
| Erosion Fission Maze | Weekly |
| Ark of Transcendence | Weekly |
| Bone Dragon Nest Light | Weekly |
| Black Dragon Nest Hardcore | Weekly |

You can remove, rename, or replace these with anything you need.

## Usage

### Opening the tracker
Just open `index.html` in any modern browser. No installation needed.

### Adding a new activity
Click **＋ Add Dungeon / Activity**, fill in the name, pick a reset type and color, then hit **Create**.

Reset types:
- **Weekly** — checkboxes clear every Saturday 9AM PH time
- **Daily** — checkboxes clear every day at 9AM PH time
- **One-time** — never auto-resets, only cleared manually
- **Counter (Inventory)** — shows +/− buttons instead of checkboxes; counts never auto-reset

### Adding entries
Each card has an input field at the bottom. Type a name (character, account, item, habit — anything) and press **Enter** or click **＋ Add**.

### Checking off a task
Click anywhere on a row to toggle it done/undone.

### Tracking tickets
In a Counter card, hit **+** when you receive a ticket and **−** when you use one. Counts won't go below 0.

### Reordering cards
Grab the **⠿⠿** handle on the left of any card header and drag it to a new position. Order is saved automatically.

### Manual reset
Use **↺ Reset All** in the top banner to clear all checkboxes across all activities at once. Counter values are not affected.

## Tech

- Plain HTML, CSS, and vanilla JavaScript — no frameworks or dependencies
- Google Fonts (Cinzel, Crimson Pro) loaded via CDN
- Data stored in `localStorage` under the key `dn_tracker_v2`
