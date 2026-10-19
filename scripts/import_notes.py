#!/usr/bin/env python3
"""Validate and atomically merge Codex-curated notes; never reads chats itself."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import re
import sys
import tempfile
from public_safety import assert_public

DEFAULT_CATALOG = Path(__file__).resolve().parents[1] / ".local" / "catalog.json"
UUID = re.compile(r"[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}")
INVOCATION = re.compile(r"(?:\$[a-z0-9][a-z0-9-]*|[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9-]*)")


def string(value, label, limit=2000):
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ValueError(f"{label} 必须是非空文本，最多 {limit} 字符")
    return value.strip()


def unique(items):
    result = []
    for item in items:
        if item not in result:
            result.append(item)
    return result


def strings(value, label, required=True):
    if not isinstance(value, list) or len(value) > 100 or (required and not value):
        raise ValueError(f"{label} 必须是{'非空' if required else ''}文本数组，最多 100 项")
    return unique([string(item, label) for item in value])


def identifier(value, label):
    if not isinstance(value, str) or not UUID.fullmatch(value):
        raise ValueError(f"{label} 必须是准确的对话或轮次 UUID")
    return value


def fields(value, allowed, label):
    if not isinstance(value, dict) or set(value) - set(allowed):
        raise ValueError(f"{label} 格式无效或包含不支持的字段")


def validate(payload, require_version=False, require_sources=False):
    fields(payload, ["sources", "skills", "schema_version", "updated_at"], "资料")
    if require_version and payload.get("schema_version") != 1:
        raise ValueError("不支持的资料版本")
    sources, skills = payload.get("sources"), payload.get("skills")
    if not isinstance(sources, list) or not isinstance(skills, list):
        raise ValueError("资料必须包含 sources 和 skills 数组")
    checked_sources, checked_skills = [], []
    for source in sources:
        fields(source, ["id", "title", "url"], "来源")
        sid = identifier(source.get("id"), "来源 ID")
        if source.get("url") != f"codex://threads/{sid}":
            raise ValueError("来源链接必须指向对应的 Codex 对话")
        checked_sources.append({"id": sid, "title": string(source.get("title"), "来源标题"), "url": source["url"]})
    for skill in skills:
        fields(skill, ["invocation", "chinese_name", "summary", "scenarios", "categories", "provider", "sources", "aliases", "notes", "verification", "replace_lists"], "技能")
        if "replace_lists" in skill and not isinstance(skill["replace_lists"], bool):
            raise ValueError("replace_lists 必须是布尔值")
        invocation = string(skill.get("invocation"), "技能调用名", 200)
        if not INVOCATION.fullmatch(invocation):
            raise ValueError("调用名必须是完整的 插件:技能名 或 $本地技能名")
        provider = string(skill.get("provider"), "插件归属", 200)
        if invocation.startswith("ecc:") != (provider == "ECC"):
            raise ValueError("ECC 归属必须与调用名前缀一致")
        refs = skill.get("sources")
        if not isinstance(refs, list) or (require_sources and not refs):
            raise ValueError("每个技能必须有来源")
        checked_refs = []
        for ref in refs:
            fields(ref, ["thread_id", "turn_id"], "技能来源")
            checked_refs.append({"thread_id": identifier(ref.get("thread_id"), "对话 ID"), "turn_id": identifier(ref.get("turn_id"), "轮次 ID")})
        verification = skill.get("verification", "来自对话介绍")
        if verification not in ["已核对本地技能定义", "来自对话介绍"]:
            raise ValueError("verification 必须明确为本地核对或对话介绍")
        note = skill.get("notes", "")
        if not isinstance(note, str) or len(note) > 5000:
            raise ValueError("notes 必须是最多 5000 字符的文本")
        checked_skills.append({
            "invocation": invocation, "chinese_name": string(skill.get("chinese_name"), "技能中文名", 200),
            "summary": string(skill.get("summary"), "技能概括"),
            "scenarios": strings(skill.get("scenarios"), "技能使用场景"),
            "categories": strings(skill.get("categories"), "分类"), "provider": provider,
            "sources": unique(checked_refs), "aliases": strings(skill.get("aliases", []), "别名", False),
            "notes": note.strip(), "verification": verification,
        })
        if skill.get("replace_lists"):
            checked_skills[-1]["replace_lists"] = True
    for items, key in [(checked_sources, "id"), (checked_skills, "invocation")]:
        if len({item[key] for item in items}) != len(items):
            raise ValueError(f"同一批次包含重复的 {key}，请先合并")
    return {"sources": checked_sources, "skills": checked_skills}


def check_references(catalog):
    source_ids = {source["id"] for source in catalog["sources"]}
    for skill in catalog["skills"]:
        if any(ref["thread_id"] not in source_ids for ref in skill["sources"]):
            raise ValueError(f"{skill['invocation']} 引用了未登记的对话")


@contextmanager
def locked(catalog):
    catalog.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (catalog.parent.parent / ".catalog.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        yield


def commit(catalog, encoded, backup=True):
    """Keep backups outside the served directory, replace only a complete file."""
    if backup and catalog.exists():
        backups = catalog.parent.parent / "backups"
        backups.mkdir(mode=0o700, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        with (backups / f"catalog-{stamp}.json").open("xb") as backup:
            os.fchmod(backup.fileno(), 0o600)
            backup.write(catalog.read_bytes())
            backup.flush()
            os.fsync(backup.fileno())
    fd, temporary = tempfile.mkstemp(prefix=".catalog-", dir=catalog.parent)
    try:
        with os.fdopen(fd, "wb") as output:
            os.fchmod(output.fileno(), 0o600 if catalog.parent.name == ".local" else 0o644)
            output.write(encoded)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, catalog)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def public_bytes(private):
    """Publish a field allowlist, never private provenance or exact activity times."""
    public_fields = ["invocation", "chinese_name", "summary", "scenarios", "categories", "provider", "aliases", "notes", "verification"]
    public = {
        "schema_version": 2,
        "updated_at": private.get("updated_at", datetime.now(timezone.utc).isoformat())[:10],
        "skills": [{key: skill[key] for key in public_fields} for skill in private["skills"]],
    }
    encoded = json.dumps(public, ensure_ascii=False, indent=2) + "\n"
    assert_public(encoded)
    return encoded.encode()


def publish(catalog, encoded):
    target = catalog.parent.parent / "public" / "catalog.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists() or target.read_bytes() != encoded:
        commit(target, encoded, backup=False)


def read_private(catalog):
    if catalog.exists():
        return json.loads(catalog.read_text())
    # A fresh clone has public notes but no private history. Preserve those notes.
    public = catalog.parent.parent / "public" / "catalog.json"
    if public.exists():
        snapshot = json.loads(public.read_text())
        if snapshot.get("schema_version") != 2:
            raise ValueError("公开资料版本无效")
        return {"schema_version": 1, "updated_at": snapshot["updated_at"], "sources": [], "skills": [{**skill, "sources": []} for skill in snapshot["skills"]]}
    return {"schema_version": 1, "sources": [], "skills": []}


def import_batch(payload, catalog=DEFAULT_CATALOG):
    incoming = validate(payload, require_sources=True)
    catalog = Path(catalog)
    with locked(catalog):
        old = read_private(catalog)
        current = validate(old, require_version=True)
        sources = {item["id"]: item for item in current["sources"]}
        skills = {item["invocation"]: item for item in current["skills"]}
        counts = {"added": 0, "updated": 0, "unchanged": 0}
        for source in incoming["sources"]:
            sources[source["id"]] = source
        for item in incoming["skills"]:
            previous = skills.get(item["invocation"])
            merged = dict(item)
            replace_lists = merged.pop("replace_lists", False)
            if previous:
                for key in ["scenarios", "categories", "sources", "aliases"]:
                    if key == "sources" or not replace_lists:
                        merged[key] = unique(previous[key] + item[key])
            status = "added" if previous is None else "unchanged" if previous == merged else "updated"
            counts[status] += 1
            skills[item["invocation"]] = merged
        result = {"sources": list(sources.values()), "skills": list(skills.values())}
        check_references(result)
        result = {"schema_version": 1, "updated_at": old.get("updated_at", datetime.now(timezone.utc).isoformat(timespec="seconds")), **result}
        changed = current != {"sources": result["sources"], "skills": result["skills"]}
        if changed:
            result["updated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        public = public_bytes(result)  # Reject leaks before any persistent mutation.
        if changed or not catalog.exists():
            commit(catalog, (json.dumps(result, ensure_ascii=False, indent=2) + "\n").encode())
        publish(catalog, public)
        return {**counts, "total": len(skills)}


def restore_catalog(backup, catalog=DEFAULT_CATALOG):
    catalog = Path(catalog)
    encoded = Path(backup).read_bytes()
    payload = json.loads(encoded)
    check_references(validate(payload, require_version=True))
    public = public_bytes(payload)
    with locked(catalog):
        commit(catalog, encoded)
        publish(catalog, public)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--input", help="已整理的 JSON 文件；- 表示标准输入")
    action.add_argument("--restore", help="恢复一份完整备份，恢复前也会备份现有资料")
    action.add_argument("--export", action="store_true", help="从本地私有资料重新生成脱敏公开笔记")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    args = parser.parse_args()
    try:
        if args.export:
            with locked(args.catalog):
                private = read_private(args.catalog)
                check_references(validate(private, require_version=True))
                publish(args.catalog, public_bytes(private))
                result = {"exported": True, "total": len(private["skills"])}
        elif args.restore:
            restore_catalog(args.restore, args.catalog)
            result = {"restored": True}
        else:
            raw = sys.stdin.read(5_000_001) if args.input == "-" else Path(args.input).read_text()
            if len(raw) > 5_000_000:
                raise ValueError("单批资料不能超过 5 MB")
            result = import_batch(json.loads(raw), args.catalog)
        print(json.dumps(result, ensure_ascii=False))
    except (ValueError, OSError, KeyError) as error:
        message = str(error) if isinstance(error, ValueError) else type(error).__name__
        print(f"收录或导出失败：{message}；可检查本地资料后重新导出。", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
