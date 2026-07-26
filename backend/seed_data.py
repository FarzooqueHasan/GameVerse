"""
Character seed data -- updated with the rich profile fields from your
10-question questionnaire (vibe, hangout, energy, superpower, stress
response, sidekick, competition style, drive, emoji).

This RESOLVES a few things that were previously blank/ambiguous from the
notebook photos:
- Anant's personality traits (previously blank) -- now fully filled in
- Siddharth's sidekick (previously ambiguous "Yoda/Jake vs Goose/Flerken")
  -- now confirmed as "Goose (chaotic mascot)" per your questionnaire

Still flagged needs_review:
- Ryaan's sidekick (left blank in your questionnaire -- placeholder in
  questionnaire_data.py, needs your real answer)
- Ryaan's exact catchphrase LINE (we have the catchphrase *style* --
  "curious social comments" -- but not a literal quote like the others have)
"""

import json
from database import get_connection, init_db

CHARACTERS = [
    {
        "name": "Tarushi",
        "role": "Management",
        "traits": ["confident", "commanding", "poised", "unshakeable", "regal"],
        "catchphrase": "Shut up peasant",
        "description": "Confident aura. Cool, stylish, sometimes bossy. Savage one-liners.",
        "superpower": "Aura & influence",
        "stress_response": "Stays cool -- or snaps if pushed",
        "sidekick": "Maverick / Miles Morales vibe",
        "hangout": "Basketball court at night / arcade",
        "energy_style": "Cool, stylish, sometimes bossy",
        "competition_style": "Cool confidence",
        "drive": "Aura & influence",
        "emoji": "\U0001F60E",
        "needs_review": 0,
    },
    {
        "name": "Farzooque",
        "role": "Management",
        "traits": ["formal", "stern", "strict", "disciplined", "no-nonsense"],
        "catchphrase": "Chup hojao",
        "description": "Serious focus. Quiet strategist -- observes first, speaks when it matters.",
        "superpower": "Logic & discipline",
        "stress_response": "Shuts everyone down",
        "sidekick": "Mr. Spock (logical partner)",
        "hangout": "Couch with a laptop",
        "energy_style": "Quiet strategist -- observes first, speaks when it matters",
        "competition_style": "Formal seriousness",
        "drive": "Discipline & order",
        "emoji": "\U0001F92B",
        "needs_review": 0,
    },
    {
        "name": "Siddharth",
        "role": "Management",
        "traits": ["enthusiastic", "chaotic", "hyper", "dedicated", "loyal", "charismatic", "popular"],
        "catchphrase": "Y'all / You know what?",
        "description": "Wild ideas. Hyper, bouncing with ideas. Random dramatic outbursts.",
        "superpower": "Creative chaos",
        "stress_response": "Explodes with energy",
        "sidekick": "Goose (chaotic mascot)",
        "hangout": "Workshop full of tools",
        "energy_style": "Hyper, bouncing with ideas",
        "competition_style": "Over-the-top enthusiasm",
        "drive": "Passion & creativity",
        "emoji": "\U0001F92F",
        "needs_review": 0,
    },
    {
        "name": "Anant",
        "role": "Management",
        "traits": ["laidback", "clever", "resourceful", "calm", "insightful"],
        "catchphrase": "Sab theek ho jayega / Did you know...",
        "description": "Smart curiosity. Chill, laid-back but insightful. Fun facts & reassurance.",
        "superpower": "Genius intellect",
        "stress_response": "Says \"Sab theek ho jayega\"",
        "sidekick": "Lazy genius buddy",
        "hangout": "Library or debate hall",
        "energy_style": "Chill, laid-back but insightful",
        "competition_style": "Smart but chill",
        "drive": "Knowledge & reassurance",
        "emoji": "\U0001F9E0",
        "needs_review": 0,
    },
    {
        "name": "Ryaan",
        "role": "Management",
        "traits": ["jolly", "cheerful", "easygoing", "warm", "social"],
        "catchphrase": "TBD -- have the style (curious social comments) but not an exact line yet",
        "description": "Social energy. Excited, always meeting new people. Curious social comments.",
        "superpower": "Social adaptability",
        "stress_response": "Distracts himself by playing sports",
        "sidekick": "TBD -- left blank in your questionnaire, needs a real answer",
        "hangout": "Busy caf\u00e9 with strangers",
        "energy_style": "Excited, always meeting new people",
        "competition_style": "Restless excitement",
        "drive": "Meeting new people",
        "emoji": "\U0001F44B",
        "needs_review": 1,
    },
]


def seed():
    init_db()
    conn = get_connection()
    conn.execute("DELETE FROM characters")
    for c in CHARACTERS:
        conn.execute(
            """INSERT INTO characters
               (name, role, traits, catchphrase, description, superpower,
                stress_response, sidekick, hangout, energy_style,
                competition_style, drive, emoji, needs_review)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                c["name"], c["role"], json.dumps(c["traits"]), c["catchphrase"],
                c["description"], c["superpower"], c["stress_response"], c["sidekick"],
                c["hangout"], c["energy_style"], c["competition_style"], c["drive"],
                c["emoji"], c["needs_review"],
            ),
        )
    conn.commit()
    conn.close()
    print(f"Seeded {len(CHARACTERS)} characters.")


if __name__ == "__main__":
    seed()
