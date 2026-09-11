import unittest

from tools.revalidate_arxiv_outcomes import eligible_records


class RevalidationTests(unittest.TestCase):

    def test_only_unattested_semantic_outcomes_are_eligible(self):
        batch = {
            "records": [
                {"arxiv_id": "1"},
                {"arxiv_id": "2"},
                {"arxiv_id": "3"},
                {"arxiv_id": "4"},
            ],
        }
        state = {
            "records": {
                "1": {"status": "inserted", "full_text_source": None},
                "2": {"status": "excluded", "full_text_source": None},
                "3": {
                    "status": "inserted",
                    "full_text_source": {"url": "https://arxiv.org/html/3"},
                },
                "4": {"status": "failed", "full_text_source": None},
            },
        }
        self.assertEqual(
            [item["arxiv_id"] for item in eligible_records(batch, state)],
            ["1", "2"],
        )
        self.assertEqual(
            [item["arxiv_id"] for item in eligible_records(
                batch, state, ["2"])],
            ["2"],
        )

if __name__ == "__main__":
    unittest.main()
