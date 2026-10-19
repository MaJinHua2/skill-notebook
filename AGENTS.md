# Project guidance

This is a public Chinese skill notebook. Prioritize accurate invocation names, readable Chinese names, concise summaries, and concrete usage scenarios.

- Preserve the read-only website and explicit user-triggered collection workflow.
- Private provenance belongs in ignored `.local/`; only sanitized notes belong in `public/catalog.json`.
- Never commit real chat IDs/titles/links, personal paths, network addresses, emails, secrets, local backups, or runtime files. Tests must use synthetic fixtures.
- Skill source lives in `skills/collect-skill-notes/`; local installation uses a symlink. Service templates live in `deploy/`; generated machine paths stay outside the repository.
- Before committing: run `python3 -m unittest discover -s tests -v`, `node --check public/app.js`, and `python3 scripts/check_public.py --staged`.
- Before publishing: inspect the final staged contents and reachable history with `python3 scripts/check_public.py --staged --history`. Report findings by relative path and category, never matched values.
- Do not add scheduled collection, learning progress tracking, external model calls, or unrelated ECC code.
