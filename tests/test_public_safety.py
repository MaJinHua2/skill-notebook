"""All examples below are deliberately synthetic, never copied from user data."""
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
from public_safety import findings, assert_public


class PublicationTests(unittest.TestCase):
    def test_blocks_sensitive_shapes_without_echoing_values(self):
        samples = [
            "/home/" + "synthetic-user/source",
            "192." + "168.12.34",
            "private" + "@example.invalid",
            "gh" + "p_" + "x" * 30,
            "12345678" + "-1234-4567-8901-123456789abc",
        ]
        for sample in samples:
            with self.subTest(category="synthetic sensitive shape"):
                self.assertTrue(findings(sample))
                with self.assertRaises(ValueError) as error:
                    assert_public(sample)
                self.assertNotIn(sample, str(error.exception))

    def test_allows_portable_examples_and_public_commit_identity(self):
        assert_public("http://127.0.0.1:8765 http://0.0.0.0:8765 http://192.0.2.1:8765")
        assert_public("00000000-0000-4000-8000-000000000001")
        assert_public("123+public-handle@users.noreply.github.com")
        assert_public('codex://threads/<UUID> $HOME SKILL_NOTEBOOK_HOME')


if __name__ == "__main__":
    unittest.main()
