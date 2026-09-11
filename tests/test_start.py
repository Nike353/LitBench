import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from scripts import start


class LauncherTests(unittest.TestCase):
    def test_source_changes_invalidate_cached_frontend(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(start, "APP", Path(directory)):
            source = Path(directory) / "src"
            source.mkdir()
            (source / "app.ts").write_text("first version")
            before = start.source_digest()
            (source / "app.ts").write_text("updated version")
            self.assertNotEqual(before, start.source_digest())

    def test_runtime_archive_starts_without_installing_node(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(start, "APP", Path(directory)), patch.object(start.subprocess, "run") as run:
            dist = Path(directory) / "dist"
            dist.mkdir()
            (dist / "index.html").write_text("ready")
            start.prepare_frontend()
            run.assert_not_called()

    def test_repeat_start_reuses_matching_build(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(start, "APP", Path(directory)), patch.object(start.subprocess, "run") as run:
            root = Path(directory)
            for name in ["dist", "src", ".litbench"]:
                (root / name).mkdir()
            (root / "dist/index.html").write_text("ready")
            (root / ".litbench/frontend.sha256").write_text(start.source_digest())
            start.prepare_frontend()
            run.assert_not_called()
