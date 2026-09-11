import copy
import json
import tempfile
import unittest
from pathlib import Path

from tools.retrieve_arxiv import (
    QUERY_SPECS,
    merge_records,
    parse_args,
    parse_feed,
    retrieve,
    validate_manifest,
)

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "tests/fixtures/library/data" / "imports" / "sources"


class ArxivRetrieverTests(unittest.TestCase):

    def source_for(self, query_id):
        return next(SOURCE_DIR.glob(f"{query_id}-*.atom.xml"))

    def test_parses_synthetic_atom_snapshot_without_network(self):
        spec = QUERY_SPECS[0]
        records = parse_feed(self.source_for(spec.query_id).read_bytes(), spec)
        self.assertGreater(len(records), 0)
        first = records[0]
        self.assertRegex(first["arxiv_id"], r"^\d{4}\.\d{4,5}$")
        self.assertTrue(first["canonical_url"].startswith(
            "https://arxiv.org/abs/"))
        self.assertIn("cs.RO", first["categories"])
        self.assertTrue(first["authors"])
        self.assertTrue(first["abstract"])

    def test_deduplicates_versions_and_merges_query_provenance(self):
        base = {
            "arxiv_id": "2607.12345",
            "updated_at": "2026-07-20T00:00:00Z",
            "submitted_at": "2026-07-19T00:00:00Z",
            "retrieval_match": {
                "query_ids": ["one"], "matched_terms": ["humanoid"]},
            "query_id": "one",
        }
        newer = {
            **base,
            "updated_at": "2026-07-21T00:00:00Z",
            "retrieval_match": {
                "query_ids": ["two"], "matched_terms": ["manipulation"]},
            "query_id": "two",
        }
        merged = merge_records([base, newer])
        self.assertEqual(len(merged), 1)
        self.assertEqual(
            merged[0]["retrieval_match"]["query_ids"], ["one", "two"])
        self.assertEqual(
            merged[0]["retrieval_match"]["matched_terms"],
            ["humanoid", "manipulation"])

    def test_builds_fifty_record_manifest_from_snapshots(self):
        with tempfile.TemporaryDirectory() as temp:
            fixture_args = []
            for spec in QUERY_SPECS:
                fixture_args.extend(
                    ["--fixture", str(self.source_for(spec.query_id))])
            args = parse_args([
                "--from", "2026-01-01",
                "--through", "2026-07-23",
                "--count", "50",
                "--snapshot-dir", str(Path(temp) / "sources"),
                "--output", str(Path(temp) / "batch.json"),
                *fixture_args,
            ])
            manifest = retrieve(args)
            self.assertEqual(validate_manifest(manifest), [])
            self.assertEqual(manifest["retrieved_count"], 50)
            self.assertEqual(len({
                item["arxiv_id"] for item in manifest["records"]}), 50)
            self.assertIsNone(manifest["agent_qualified_count"])
            self.assertEqual(
                manifest["relevance_policy"]["evaluated_by"],
                "selected-local-agent",
            )

    def test_manifest_verifier_rejects_tampered_query_provenance(self):
        manifest = json.loads(
            (ROOT / "tests/fixtures/library/data" / "imports" /
             "humanoid-loco-manipulation-2026.json").read_text(
                 encoding="utf-8"))
        tampered = copy.deepcopy(manifest)
        tampered["records"][0]["retrieval_match"]["query_ids"] = [
            "humanoid-whole-body"
        ]

        errors = validate_manifest(tampered)

        self.assertTrue(any("retrieval_match" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
