import re

BANNED_PHRASES = [
    r"\bBased on (the )?(provided )?(context|snippets)[^.\n]*[.\n]?",
    r"\bThese (features|details) are mentioned across (multiple|several) (context )?snippets[^.\n]*[.\n]?",
    r"\bFrom the (context|snippets),?[^.\n]*[.\n]?",
    r"\bAccording to the (context|snippets)[^.\n]*[.\n]?",
    r"\bI can only conclude that[^.\n]*[.\n]?",
    r"\bthe snippets\b",
    r"\bthe context\b",
]

def polish_answer(text: str) -> str:
    t = text
    for pat in BANNED_PHRASES:
        t = re.sub(pat, "", t, flags=re.IGNORECASE)
    # collapse blank lines / spaces
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    return t
