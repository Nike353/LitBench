import unittest

from tools.process_arxiv_batch import eligible_records, local_server_url


class BatchRunnerTests(unittest.TestCase):

    def test_eligible_records_skip_terminal_outcomes(self):
        batch = {
            "records": [
                {"arxiv_id": "one"},
                {"arxiv_id": "two"},
                {"arxiv_id": "three"},
                {"arxiv_id": "four"},
            ],
        }
        state = {
            "records": {
                "one": {"status": "queued"},
                "two": {"status": "inserted"},
                "three": {"status": "excluded"},
                "four": {"status": "failed"},
            },
        }
        self.assertEqual(
            [item["arxiv_id"] for item in eligible_records(batch, state)],
            ["one", "four"],
        )
        self.assertEqual(
            [item["arxiv_id"] for item in eligible_records(
                batch, state, ["four"])],
            ["four"],
        )

    def test_runner_only_accepts_local_servers(self):
        self.assertEqual(
            local_server_url("http://127.0.0.1:8001/"),
            "http://127.0.0.1:8001",
        )
        with self.assertRaises(Exception):
            local_server_url("https://example.com")


if __name__ == "__main__":
    unittest.main()
