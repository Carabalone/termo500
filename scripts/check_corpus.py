#!/usr/bin/env python3
"""Fail when regeneration changes a checked-in corpus artifact."""
import hashlib
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
generated = root / "assets" / "generated"
before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in generated.iterdir() if p.is_file()}
subprocess.run(["python3", str(root / "scripts" / "build_corpus.py")], check=True)
after = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in generated.iterdir() if p.is_file()}
if before != after:
    raise SystemExit("Corpus regeneration was not deterministic; generated files changed")
print("Corpus regeneration is deterministic.")
