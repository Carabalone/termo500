import json
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "corpus.txt"
WORDS = ROOT / "assets" / "words.txt"
ACCENTS = ROOT / "assets" / "accents.txt"
EXTRA_WORDS = ["amigo", "vasco", "mengo"]


def normalize(word: str) -> str:
    decomposed = unicodedata.normalize("NFD", word)
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn").upper()


lines = [line for line in SOURCE.read_text(encoding="utf-8").splitlines() if line.strip()]
responses = json.loads(lines[-1]) + EXTRA_WORDS
entries: list[tuple[str, str]] = []
seen: set[str] = set()

for response in responses:
    display = response.upper()
    key = normalize(display)
    if len(key) != 5 or not key.isascii() or not key.isalpha():
        raise ValueError(f"Invalid five-letter response: {response!r}")
    if key in seen:
        raise ValueError(f"Normalization collision for: {response!r}")
    seen.add(key)
    entries.append((key, display))

WORDS.write_text("".join(f"{key}\n" for key, _ in entries), encoding="utf-8")
ACCENTS.write_text(
    "".join(f"{key}\t{display}\n" for key, display in entries if key != display),
    encoding="utf-8",
)

print(f"Wrote {len(entries)} words and {sum(key != display for key, display in entries)} accent overrides.")
