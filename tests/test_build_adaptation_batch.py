import unittest

from tools.build_adaptation_batch import parse_ledger, select_entries


class AdaptationBatchTests(unittest.TestCase):

    def test_parses_last_appendix_heading_and_arxiv_overrides(self):
        text = """
Appendix B. Verified source ledger [1-140]
table of contents

Appendix B. Verified source ledger
[87] Example Author et al. (2020). Direct Paper. arXiv.
https://arxiv.org/abs/2001.00001
[88] Example Author et al. (2020). Publisher Paper. Science Robotics.
https://example.com/publisher
[89] Example Author et al. (2020). Another Paper. arXiv.
https://arxiv.org/abs/2001.00002

Methodological note
"""
        entries = parse_ledger(text)

        self.assertEqual(entries[87]["arxiv_id"], "2001.00001")
        self.assertEqual(entries[87]["publication_year"], 2020)
        self.assertEqual(entries[88]["arxiv_id"], "2012.05810")
        self.assertEqual(entries[89]["arxiv_id"], "2001.00002")

    def test_preserves_publisher_only_entries_without_fabricating_ids(self):
        text = """
Appendix B. Verified source ledger
[63] Example Author et al. (2015). Publisher Only. NeurIPS.
https://example.com/paper

Methodological note
"""
        entries = parse_ledger(text)

        self.assertIsNone(entries[63]["arxiv_id"])
        self.assertEqual(entries[63]["source_url"], "https://example.com/paper")

    def test_replaces_existing_graph_papers_with_later_ledger_entries(self):
        entries = {
            51: {"number": 51, "arxiv_id": "2001.00001", "title": "One"},
            52: {"number": 52, "arxiv_id": "2001.00002", "title": "Duplicate"},
            53: {"number": 53, "arxiv_id": None, "title": "Publisher only"},
            54: {"number": 54, "arxiv_id": "2001.00003", "title": "Two"},
        }

        selected, skipped, next_entry = select_entries(
            entries, 51, 2, {"2001.00002"})

        self.assertEqual(
            [entry["number"] for entry in selected], [51, 54])
        self.assertEqual(
            [entry["number"] for entry in skipped], [52, 53])
        self.assertIn("already represented", skipped[0]["exclusion_reason"])
        self.assertIn("no matching arXiv", skipped[1]["exclusion_reason"])
        self.assertEqual(next_entry, 55)


if __name__ == "__main__":
    unittest.main()
