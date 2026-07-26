"""
The 10-question character allocation quiz.

IMPORTANT: character mapping is intentionally kept server-side only.
GET /questionnaire strips the "character" field before sending to the
frontend, so a curious participant can't just open dev tools / view the
network response and see which option maps to which character.

⚠️ Q7 (sidekick) for Ryaan was left blank in your original questionnaire.
I've put a placeholder option in -- swap it for whatever you actually want.
"""

QUESTIONNAIRE = [
    {
        "id": 1,
        "question": "When starting a new project, your vibe is…",
        "options": [
            {"text": "Wild ideas", "character": "Siddharth"},
            {"text": "Confident aura", "character": "Tarushi"},
            {"text": "Serious focus", "character": "Farzooque"},
            {"text": "Smart curiosity", "character": "Anant"},
            {"text": "Social energy", "character": "Ryaan"},
        ],
    },
    {
        "id": 2,
        "question": "Pick your ideal hangout spot:",
        "options": [
            {"text": "Workshop full of tools", "character": "Siddharth"},
            {"text": "Basketball court at night / arcade", "character": "Tarushi"},
            {"text": "Couch with a laptop", "character": "Farzooque"},
            {"text": "Library or debate hall", "character": "Anant"},
            {"text": "Busy café with strangers", "character": "Ryaan"},
        ],
    },
    {
        "id": 3,
        "question": "Your energy level in a group project:",
        "options": [
            {"text": "Hyper, bouncing with ideas", "character": "Siddharth"},
            {"text": "Cool, stylish, sometimes bossy", "character": "Tarushi"},
            {"text": "Quiet strategist — observes first, speaks when it matters", "character": "Farzooque"},
            {"text": "Chill, laid-back but insightful", "character": "Anant"},
            {"text": "Excited, always meeting new people", "character": "Ryaan"},
        ],
    },
    {
        "id": 4,
        "question": "What's your catchphrase style?",
        "options": [
            {"text": "Random dramatic outbursts", "character": "Siddharth"},
            {"text": "Savage one-liners", "character": "Tarushi"},
            {"text": "Short commands", "character": "Farzooque"},
            {"text": "Fun facts & reassurance", "character": "Anant"},
            {"text": "Curious social comments", "character": "Ryaan"},
        ],
    },
    {
        "id": 5,
        "question": "Choose your superpower:",
        "options": [
            {"text": "Creative chaos", "character": "Siddharth"},
            {"text": "Aura & influence", "character": "Tarushi"},
            {"text": "Logic & discipline", "character": "Farzooque"},
            {"text": "Genius intellect", "character": "Anant"},
            {"text": "Social adaptability", "character": "Ryaan"},
        ],
    },
    {
        "id": 6,
        "question": "How do you handle stress?",
        "options": [
            {"text": "Explode with energy", "character": "Siddharth"},
            {"text": "Stay cool (or snap if pushed)", "character": "Tarushi"},
            {"text": "Shut everyone down", "character": "Farzooque"},
            {"text": "Say \u201cSab theek ho jayega\u201d", "character": "Anant"},
            {"text": "Distract yourself by playing sports", "character": "Ryaan"},
        ],
    },
    {
        "id": 7,
        "question": "Pick your sidekick:",
        "options": [
            {"text": "Goose (chaotic mascot)", "character": "Siddharth"},
            {"text": "Maverick / Miles Morales vibe", "character": "Tarushi"},
            {"text": "Mr. Spock (logical partner)", "character": "Farzooque"},
            {"text": "Lazy genius buddy", "character": "Anant"},
            {"text": "PLACEHOLDER -- you left this blank, fill in Ryaan's sidekick", "character": "Ryaan"},
        ],
    },
    {
        "id": 8,
        "question": "Your style in competition:",
        "options": [
            {"text": "Over-the-top enthusiasm", "character": "Siddharth"},
            {"text": "Cool confidence", "character": "Tarushi"},
            {"text": "Formal seriousness", "character": "Farzooque"},
            {"text": "Smart but chill", "character": "Anant"},
            {"text": "Restless excitement", "character": "Ryaan"},
        ],
    },
    {
        "id": 9,
        "question": "What drives you most?",
        "options": [
            {"text": "Passion & creativity", "character": "Siddharth"},
            {"text": "Aura & influence", "character": "Tarushi"},
            {"text": "Discipline & order", "character": "Farzooque"},
            {"text": "Knowledge & reassurance", "character": "Anant"},
            {"text": "Meeting new people", "character": "Ryaan"},
        ],
    },
    {
        "id": 10,
        "question": "Final emoji pick:",
        "options": [
            {"text": "\U0001F92F", "character": "Siddharth"},
            {"text": "\U0001F60E", "character": "Tarushi"},
            {"text": "\U0001F92B", "character": "Farzooque"},
            {"text": "\U0001F9E0", "character": "Anant"},
            {"text": "\U0001F44B", "character": "Ryaan"},
        ],
    },
]
