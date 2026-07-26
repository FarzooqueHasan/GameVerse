# GameVerse — CelesteCon Trait Matcher (MVP)

A working prototype of the Management-POV trait-matching mechanic. Runs 100%
locally — no internet needed, safe for an offline live demo.

## What's built so far
- SQLite database of the 5 Management characters (Tanushi, Farzooque, Sid, Anant, Ryaan)
- FastAPI backend with a `/match` endpoint that scores user-entered traits against each character
- Simple frontend to enter traits and see the match + full ranking breakdown

## ⚠️ Data that still needs your input
Marked `needs_review: true` in `backend/seed_data.py`:
- **Anant** — personality traits were blank in the notes. Currently placeholder ("laidback, clever, resourceful, calm"). Needs your actual traits.
- **Ryaan** — catchphrase lines were unclear ("we are not men...", "semi-charmed life", "stop with tan...?"). Needs the real lines.
- **Sid** — archetype reference unclear (Yoda/Jake vs. Goose/Flerken). Needs confirmation of which applies.

Once you send these, update `CHARACTERS` in `backend/seed_data.py` and re-run
`python seed_data.py` to refresh the database.

## How to run it (no internet required)

### 1. Start the backend
```bash
cd backend
pip install -r requirements.txt
python seed_data.py        # only needed once, or after editing character data
uvicorn main:app --reload --port 8000
```
Leave this terminal running.

### 2. Open the frontend
Just open `frontend/index.html` directly in a browser (double-click it, or
right-click → Open With → Browser). It calls the backend at `localhost:8000`.

## How matching works
Each character has a list of trait keywords. When a user types in free-text
traits, the backend:
1. Normalizes casual words via a synonym dictionary (e.g. "energetic" → "enthusiastic", "crazy" → "chaotic") — extend this dictionary in `main.py` as you playtest with real people's word choices
2. Fuzzy-matches each input trait against each character's tags (handles typos/near-matches)
3. Averages the best-match scores per character and ranks them

Everything runs with Python's standard library (`difflib`) — no ML models,
no API calls, so it's fully offline-safe for the demo.

## Next steps (see the 3-day plan)
- Fill in the flagged character data above
- Build out dialogue/story content for the Management POV endings
- Add lighter Participant + Judges POV branches
- Swap in real character art / backgrounds (royalty-free, credited per the rules)
