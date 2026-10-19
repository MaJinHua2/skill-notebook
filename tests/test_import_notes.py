"""Check the persistent data contract, including retries and failed updates."""
import importlib.util
import json
from pathlib import Path
import tempfile
import sys
import unittest

MODULE = Path(__file__).parents[1] / "scripts" / "import_notes.py"
sys.path.insert(0, str(MODULE.parent))
spec = importlib.util.spec_from_file_location("import_notes", MODULE)
notes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notes)

THREAD = "00000000-0000-4000-8000-000000000001"
TURN = "00000000-0000-4000-8000-000000000002"


def batch():
    return {
        "sources": [{"id": THREAD, "title": "技能建议", "url": f"codex://threads/{THREAD}"}],
        "skills": [{
            "invocation": "ecc:test-collaboration", "chinese_name": "需求验证协作",
            "summary": "将需求与验证证据关联。", "scenarios": ["核对需求验证缺口"],
            "categories": ["需求进度与验证"], "provider": "ECC",
            "sources": [{"thread_id": THREAD, "turn_id": TURN}],
            "aliases": [], "notes": "不等于自动计算完成百分比。",
            "verification": "已核对本地技能定义",
        }],
    }


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / ".local" / "catalog.json"

    def test_retry_is_a_noop_and_corrections_preserve_scenarios(self):
        self.assertEqual(notes.import_batch(batch(), self.path)["added"], 1)
        first = self.path.read_bytes()
        self.assertEqual(notes.import_batch(batch(), self.path)["unchanged"], 1)
        self.assertEqual(self.path.read_bytes(), first)
        corrected = batch()
        corrected["skills"][0]["summary"] = "核对需求和测试之间的证据覆盖。"
        corrected["skills"][0]["scenarios"] = ["交付前检查测试证据"]
        self.assertEqual(notes.import_batch(corrected, self.path)["updated"], 1)
        result = json.loads(self.path.read_text())
        self.assertEqual(len(result["skills"]), 1)
        self.assertEqual(result["skills"][0]["scenarios"], ["核对需求验证缺口", "交付前检查测试证据"])
        self.assertEqual(result["skills"][0]["summary"], corrected["skills"][0]["summary"])
        self.assertEqual(len(list((self.path.parents[1] / "backups").glob("*.json"))), 1)

    def test_invalid_batch_does_not_change_existing_catalog(self):
        notes.import_batch(batch(), self.path)
        original = self.path.read_bytes()
        invalid = batch()
        invalid["skills"][0]["sources"][0]["thread_id"] = "not-a-thread"
        with self.assertRaises(ValueError):
            notes.import_batch(invalid, self.path)
        self.assertEqual(original, self.path.read_bytes())

    def test_explicit_correction_can_remove_an_inaccurate_scenario(self):
        notes.import_batch(batch(), self.path)
        correction = batch()
        correction["skills"][0]["replace_lists"] = True
        correction["skills"][0]["scenarios"] = ["新的准确场景"]
        notes.import_batch(correction, self.path)
        skill = json.loads(self.path.read_text())["skills"][0]
        self.assertEqual(skill["scenarios"], ["新的准确场景"])
        self.assertNotIn("replace_lists", skill)
        self.assertEqual(skill["sources"], batch()["skills"][0]["sources"])

    def test_public_projection_removes_private_provenance(self):
        payload = batch()
        payload["sources"][0]["title"] = "仅本地保留的来源标题"
        notes.import_batch(payload, self.path)
        public = self.path.parents[1] / "public" / "catalog.json"
        text = public.read_text()
        self.assertNotIn(THREAD, text)
        self.assertNotIn(TURN, text)
        self.assertNotIn(payload["sources"][0]["title"], text)
        self.assertNotIn("sources", text)
        self.assertEqual(json.loads(text)["schema_version"], 2)

    def test_private_values_in_public_fields_are_rejected_before_writing(self):
        notes.import_batch(batch(), self.path)
        before = self.path.read_bytes()
        public = self.path.parents[1] / "public" / "catalog.json"
        public_before = public.read_bytes()
        bad = batch()
        bad["skills"][0]["summary"] = "/home/" + "private-user/project"
        with self.assertRaises(ValueError):
            notes.import_batch(bad, self.path)
        self.assertEqual(self.path.read_bytes(), before)
        self.assertEqual(public.read_bytes(), public_before)

    def test_first_import_in_fresh_clone_preserves_public_notes(self):
        notes.import_batch(batch(), self.path)
        self.path.unlink()
        new = batch()
        new["skills"][0]["invocation"] = "ecc:second-note"
        notes.import_batch(new, self.path)
        self.assertEqual(len(json.loads(self.path.read_text())["skills"]), 2)

    def test_write_failure_keeps_old_catalog(self):
        from unittest.mock import patch
        notes.import_batch(batch(), self.path)
        original = self.path.read_bytes()
        changed = batch()
        changed["skills"][0]["summary"] = "修订说明"
        with patch.object(notes.os, "replace", side_effect=OSError("disk error")):
            with self.assertRaises(OSError):
                notes.import_batch(changed, self.path)
        self.assertEqual(original, self.path.read_bytes())

    def test_rejects_duplicate_keys_bad_links_and_empty_core_fields(self):
        for field, value in [("invocation", "update-docs"), ("summary", " "), ("scenarios", [])]:
            invalid = batch()
            invalid["skills"][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                notes.import_batch(invalid, self.path)
        invalid = batch()
        invalid["sources"][0]["url"] = "javascript:alert(1)"
        with self.assertRaises(ValueError):
            notes.import_batch(invalid, self.path)
        invalid = batch()
        invalid["skills"] *= 2
        with self.assertRaises(ValueError):
            notes.import_batch(invalid, self.path)

    def test_backup_can_be_restored_atomically(self):
        notes.import_batch(batch(), self.path)
        first = self.path.read_bytes()
        changed = batch()
        changed["skills"][0]["summary"] = "修改后的概括"
        notes.import_batch(changed, self.path)
        backup = next((self.path.parents[1] / "backups").glob("*.json"))
        notes.restore_catalog(backup, self.path)
        self.assertEqual(first, self.path.read_bytes())

    def test_concurrent_processes_do_not_lose_distinct_skills(self):
        import subprocess
        import sys
        jobs = []
        for index in range(6):
            payload = batch()
            payload["skills"][0]["invocation"] = f"ecc:concurrent-{index}"
            jobs.append(subprocess.Popen(
                [sys.executable, str(MODULE), "--input", "-", "--catalog", str(self.path)],
                stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            ))
            jobs[-1].stdin.write(json.dumps(payload))
            jobs[-1].stdin.close()
            jobs[-1].stdin = None
        for job in jobs:
            output, error = job.communicate(timeout=10)
            self.assertEqual(job.returncode, 0, error or output)
        result = json.loads(self.path.read_text())
        self.assertEqual(len(result["skills"]), 6)
        self.assertEqual(len(result["sources"]), 1)


if __name__ == "__main__":
    unittest.main()
