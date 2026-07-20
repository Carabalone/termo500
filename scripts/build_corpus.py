#!/usr/bin/env python3
"""Build the versioned Termo500 lexicon.

The checked-in source snapshot is deliberately never consumed by the app.  This
script is the only place where source data and editorial decisions are merged.
"""
from __future__ import annotations

import hashlib
import json
import unicodedata
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "corpus.txt"  # bootstrap snapshot; replace through a source adapter
EDITORIAL = ASSETS / "editorial"
GENERATED = ASSETS / "generated"
VERSION = "2026.07.20"
PUBLISHED_THROUGH = "2026-07-20"
INVARIANT_S = {"ADEUS", "ATLAS", "ATRAS", "CAOS", "DEUS", "LAPIS", "MENOS", "OASIS", "PIRES", "TENIS", "VIRUS"}


def normalize(word: str) -> str:
    value = unicodedata.normalize("NFD", word.strip())
    return "".join(c for c in value if unicodedata.category(c) != "Mn").upper()


def valid(word: str) -> bool:
    key = normalize(word)
    return len(key) == 5 and key.isascii() and key.isalpha()


def answer_id(key: str) -> str:
    return hashlib.sha256(key.encode("ascii")).hexdigest()[:10]


def regular_conjugations(infinitives: set[str]) -> set[str]:
    forms: set[str] = set()
    endings = {"AR": ("O", "A", "E", "AS", "AM", "OU", "EI"), "ER": ("O", "E", "ES", "EM", "EU", "I", "IA"), "IR": ("O", "E", "ES", "EM", "IU", "I", "IA")}
    for verb in infinitives:
        suffix = verb[-2:]
        if suffix in endings:
            forms.update(verb[:-2] + ending for ending in endings[suffix])
    return {form for form in forms if len(form) == 5}


def read_allow() -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for line in (EDITORIAL / "allow.tsv").read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        display, lemma, pos, frequency, reason, flags = line.split("\t")
        result[normalize(display)] = {
            "id": answer_id(normalize(display)), "key": normalize(display), "display": display.upper(), "lemma": normalize(lemma),
            "pos": pos, "frequency": float(frequency), "source": "editorial-allow",
            "reason": reason, "family": normalize(lemma),
            "sensitive": "sensitive" in flags.split(","),
        }
    return result


def main() -> None:
    lines = [line for line in SOURCE.read_text(encoding="utf-8").splitlines() if line.strip()]
    source_guesses: list[str] = json.loads(lines[0])
    legacy_answers: list[str] = json.loads(lines[-1])
    allow = read_allow()
    denied = {normalize(x) for x in (EDITORIAL / "deny.txt").read_text(encoding="utf-8").splitlines() if x and not x.startswith("#")}
    source_keys = {normalize(word) for word in source_guesses if valid(word)}
    conjugated = regular_conjugations({key for key in source_keys if key.endswith(("AR", "ER", "IR"))})

    spellings: dict[str, list[str]] = defaultdict(list)
    for word in [*source_guesses, *legacy_answers, *(str(x["display"]) for x in allow.values())]:
        if valid(word) and word.upper() not in spellings[normalize(word)]:
            spellings[normalize(word)].append(word.upper())

    # A response spelling wins a normalization collision; allow.tsv wins last.
    canonical = {key: values[0] for key, values in spellings.items()}
    for word in legacy_answers:
        if valid(word):
            canonical[normalize(word)] = word.upper()
    for key, entry in allow.items():
        canonical[key] = str(entry["display"])

    guesses = sorted(canonical)
    responses: list[dict[str, object]] = []
    seen: set[str] = set()
    for display in legacy_answers:
        key = normalize(display)
        is_plural = key.endswith("S") and key not in INVARIANT_S
        is_conjugated = key in conjugated and key not in allow
        if not valid(display) or key in denied or key in seen or is_plural or is_conjugated:
            continue
        seen.add(key)
        is_verb = display.lower().endswith("r")
        responses.append({
            "id": answer_id(key), "key": key, "display": canonical[key], "lemma": key,
            "pos": "verb" if is_verb else "noun-or-adjective",
            "frequency": None, "source": "legacy-reviewed-seed",
            "reason": "entrada familiar preservada da revisão editorial inicial",
            "family": key, "sensitive": False,
        })
    for key, entry in allow.items():
        if key in seen:
            responses = [entry if item["key"] == key else item for item in responses]
        else:
            responses.append(entry)
            seen.add(key)

    response_by_key = {str(item["key"]): item for item in responses}
    for key, item in response_by_key.items():
        counterpart = key[:-1] + ("A" if key.endswith("O") else "O")
        if key.endswith(("A", "O")) and counterpart in response_by_key:
            item["family"] = min(key, counterpart)[:-1]

    if not all(item["key"] in guesses for item in responses):
        raise RuntimeError("every answer must also be a guess")

    # Freeze the only dates that had been published at migration time.
    frozen = [
        {"date": "2026-07-18", "key": "TERMO"},
        {"date": "2026-07-19", "key": "SUITE"},
        {"date": "2026-07-20", "key": "AVIDO"},
    ]
    answer_keys = {str(item["key"]) for item in responses}
    if any(item["key"] not in answer_keys for item in frozen):
        raise RuntimeError("a frozen answer is missing from the answer set")
    schedule = list(frozen)
    cursor = date.fromisoformat(PUBLISHED_THROUGH) + timedelta(days=1)
    pool = [item for item in responses if item["key"] not in {x["key"] for x in frozen}]
    recent_families = [response_by_key[x["key"]]["family"] for x in frozen]
    for _ in range(365 * 20):
        if not pool:
            pool = list(responses)
        index = next((i for i, item in enumerate(pool) if item["family"] not in recent_families[-180:]), 0)
        item = pool.pop(index)
        schedule.append({"date": cursor.isoformat(), "key": str(item["key"])})
        recent_families.append(str(item["family"]))
        cursor += timedelta(days=1)

    GENERATED.mkdir(exist_ok=True)
    payloads = {
        "guesses.txt": "".join(f"{key}\n" for key in guesses),
        "answers.json": json.dumps({"version": VERSION, "answers": responses}, ensure_ascii=False, indent=2) + "\n",
        "schedule.json": json.dumps({"version": 1, "publishedThrough": PUBLISHED_THROUGH, "entries": schedule}, ensure_ascii=False, indent=2) + "\n",
        "legacy-answers.json": json.dumps([{"key": normalize(x), "display": x.upper()} for x in [*legacy_answers, "amigo", "vasco", "mengo"]], ensure_ascii=False, indent=2) + "\n",
    }
    for name, content in payloads.items():
        (GENERATED / name).write_text(content, encoding="utf-8")

    collisions = {key: values for key, values in spellings.items() if len(values) > 1}
    report = {
        "version": VERSION,
        "counts": {"guesses": len(guesses), "answers": len(responses), "collisions": len(collisions), "manualDenied": len(denied), "regularConjugationsDetected": len(conjugated)},
        "sources": [{"path": "assets/corpus.txt", "sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(), "role": "bootstrap guess forms and reviewed legacy seed"}],
        "parameters": {"letters": 5, "normalization": "NFD, remove marks, uppercase ASCII", "automaticAnswerZipf": 3.5, "reviewZipf": [3.0, 3.49]},
        "collisions": collisions,
        "manualAllow": sorted(allow), "manualDeny": sorted(denied),
    }
    (GENERATED / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Generated {len(guesses)} guesses and {len(responses)} answers ({len(collisions)} resolved collisions).")


if __name__ == "__main__":
    main()
