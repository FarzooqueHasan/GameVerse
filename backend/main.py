"""
GameVerse backend -- runs entirely on localhost, no internet required.
Start with: uvicorn main:app --reload --port 8000
"""

import json
import difflib
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_connection, init_db
from seed_data import seed
from questionnaire_data import QUESTIONNAIRE

app = FastAPI(title="GameVerse - CelesteCon Trait Matcher")

# Wide-open CORS since this is a local-only demo tool, not a public deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Slang / synonym expansion so casual free-text input still matches our tags.
# Add to this freely as you test with real people's word choices.
SYNONYMS = {
    "energetic": "enthusiastic",
    "hyper": "chaotic",
    "crazy": "chaotic",
    "adhd": "chaotic",
    "strict": "formal",
    "mean": "stern",
    "serious": "formal",
    "chill": "laidback",
    "lazy": "laidback",
    "smart": "clever",
    "happy": "jolly",
    "cheerful": "jolly",
    "friendly": "warm",
    "loyal": "dedicated",
    "popular": "charismatic",
    "confident": "confident",
}


def normalize(word: str) -> str:
    w = word.strip().lower()
    return SYNONYMS.get(w, w)


def similarity(a: str, b: str) -> float:
    if a == b:
        return 1.0
    return difflib.SequenceMatcher(None, a, b).ratio()


class MatchRequest(BaseModel):
    traits: List[str]


class AllocateRequest(BaseModel):
    answers: List[int]  # one 0-4 index per question, in question order


@app.on_event("startup")
def startup():
    init_db()
    conn = get_connection()
    count = conn.execute("SELECT COUNT(*) as c FROM characters").fetchone()["c"]
    conn.close()
    if count == 0:
        seed()


@app.get("/characters")
def list_characters():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM characters").fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        d["traits"] = json.loads(d["traits"])
        out.append(d)
    return out


@app.post("/match")
def match_traits(req: MatchRequest):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM characters").fetchall()
    conn.close()

    user_traits = [normalize(t) for t in req.traits if t.strip()]
    results = []

    for row in rows:
        char_traits = json.loads(row["traits"])
        total_score = 0.0
        matched_pairs = []

        for ut in user_traits:
            best_sim = 0.0
            best_ct = None
            for ct in char_traits:
                sim = similarity(ut, ct)
                if sim > best_sim:
                    best_sim = sim
                    best_ct = ct
            total_score += best_sim
            if best_sim > 0.4:
                matched_pairs.append({
                    "input": ut,
                    "matched_trait": best_ct,
                    "score": round(best_sim, 2),
                })

        avg_score = total_score / len(user_traits) if user_traits else 0.0

        results.append({
            "name": row["name"],
            "role": row["role"],
            "catchphrase": row["catchphrase"],
            "description": row["description"],
            "needs_review": bool(row["needs_review"]),
            "score": round(avg_score, 3),
            "matched_pairs": matched_pairs,
        })

    results.sort(key=lambda r: r["score"], reverse=True)
    return {"input_traits": req.traits, "ranking": results}


@app.get("/questionnaire")
def get_questionnaire():
    """
    Public-safe version of the quiz -- character mapping is stripped out
    so it can't be read from the browser's network tab / dev tools.
    """
    return [
        {
            "id": q["id"],
            "question": q["question"],
            "options": [opt["text"] for opt in q["options"]],
        }
        for q in QUESTIONNAIRE
    ]


@app.post("/allocate")
def allocate_character(req: AllocateRequest):
    """
    Real allocation mechanic: one vote per question (via the QUESTIONNAIRE's
    hidden character mapping), tally the votes, return the winner.
    Tie-break: whichever tied character's vote appeared earliest in the
    sequence of answers wins -- deterministic and easy to explain to judges.
    """
    if len(req.answers) != len(QUESTIONNAIRE):
        return {"error": f"Expected {len(QUESTIONNAIRE)} answers, got {len(req.answers)}"}

    votes = []
    for q, ans_idx in zip(QUESTIONNAIRE, req.answers):
        if not (0 <= ans_idx < len(q["options"])):
            return {"error": f"Invalid answer index {ans_idx} for question {q['id']}"}
        votes.append(q["options"][ans_idx]["character"])

    tally = {}
    first_seen = {}
    for i, name in enumerate(votes):
        tally[name] = tally.get(name, 0) + 1
        if name not in first_seen:
            first_seen[name] = i

    max_votes = max(tally.values())
    tied = [name for name, count in tally.items() if count == max_votes]
    winner_name = min(tied, key=lambda n: first_seen[n])

    conn = get_connection()
    row = conn.execute("SELECT * FROM characters WHERE name = ?", (winner_name,)).fetchone()
    conn.close()

    profile = dict(row) if row else {"name": winner_name}
    if row:
        profile["traits"] = json.loads(profile["traits"])

    return {
        "votes": votes,
        "tally": tally,
        "winner": winner_name,
        "profile": profile,
    }
