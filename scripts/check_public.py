#!/usr/bin/env python3
"""Check staged/tracked files and optional Git history without revealing matches."""
import argparse
from pathlib import Path
import subprocess
import sys

from public_safety import findings

ROOT = Path(__file__).resolve().parents[1]
PRIVATE_PARTS = {".local", "backups", "__pycache__", ".venv"}


def git(*args, binary=False):
    result = subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, check=True)
    return result.stdout if binary else result.stdout.decode("utf-8")


def scan(label, data):
    try:
        text = data.decode("utf-8") if isinstance(data, bytes) else data
    except UnicodeDecodeError:
        print(f"{label}: binary file needs explicit review")
        return 1
    issues = findings(text)
    for line, category in issues:
        print(f"{label}:{line}: {category} [redacted]")
    return len(issues)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--staged", action="store_true", help="检查暂存区中的实际内容")
    parser.add_argument("--history", action="store_true", help="同时检查可达提交的文件、身份与提交说明")
    args = parser.parse_args()
    failed = 0
    paths = git("ls-files", "--cached", "-z").split("\0")
    for name in filter(None, paths):
        if set(Path(name).parts) & PRIVATE_PARTS or Path(name).name.startswith(".env"):
            print(f"{name}: private-path [redacted]")
            failed += 1
        try:
            data = git("show", f":{name}", binary=True) if args.staged else (ROOT / name).read_bytes()
            failed += scan(name, data)
        except (OSError, subprocess.CalledProcessError):
            print(f"{name}: unable to inspect")
            failed += 1
    if args.history:
        for rev in git("rev-list", "--all").splitlines():
            metadata = git("show", "-s", "--format=%an%n%ae%n%cn%n%ce%n%B", rev)
            failed += scan(f"commit/{rev[:12]}", metadata)
            for name in filter(None, git("ls-tree", "-r", "--name-only", "-z", rev).split("\0")):
                if set(Path(name).parts) & PRIVATE_PARTS or Path(name).name.startswith(".env"):
                    print(f"history/{name}: private-path [redacted]")
                    failed += 1
                failed += scan(f"history/{name}", git("show", f"{rev}:{name}", binary=True))
    print(f"Publication check: {len(list(filter(None, paths)))} files; {failed} findings")
    return bool(failed)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except subprocess.CalledProcessError:
        print("Publication check failed: Git inspection unavailable", file=sys.stderr)
        sys.exit(1)
