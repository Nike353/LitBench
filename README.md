# LitBench

A local research workspace for building your own paper universe. Explore papers,
methods, and evidence in a 2D lineage map or 3D graph; ask questions through Codex
or Claude Code; save learnings; and compare papers side by side.

## Start your own library

On macOS or Linux, install Python 3.10+ and a signed-in Codex or Claude Code CLI.
Source builds also require Node.js 20.19+ and npm. A prebuilt runtime archive
includes the frontend, so Node.js is not needed to run it.

```sh
git clone https://github.com/Nike353/LitBench.git
cd LitBench
python3 scripts/start.py
```

For source distributions, the launcher installs locked frontend dependencies and
builds the UI on first run. Open [LitBench](http://127.0.0.1:8000) in your browser.
Use **Add paper** to import your first paper and review its proposed connections.
The repository starts empty: it contains no personal papers or saved conversations.
You can browse and manually edit without an agent.

Your library is separate from the application. The default location is
`~/Library/Application Support/LitBench/default` on macOS and
`~/.local/share/LitBench/default` on Linux (honoring `XDG_DATA_HOME`).

```sh
python3 scripts/start.py --workspace /path/to/my-library --port 8000
python3 scripts/start.py --doctor
```

To open an existing repository's library in place:

```sh
python3 scripts/start.py --workspace .
```

The server binds to localhost. Your files remain local; AI operations send
selected context through your agent's configured provider and use its account
limits. LitBench needs no separate API key or installed agent skill.

## Research workflow

- **Discuss:** choose papers, a cluster, or a method; ask questions with citations.
- **Save learnings:** append an answer to personal notes while preserving original
  source notes.
- **Change your graph:** ask an agent to rename, move, create, or connect records;
  inspect before/after proposals and accept the bundle.
- **Compare:** choose 2–20 papers, preset or custom columns, and inspect evidence
  for each cell. Export CSV, Markdown, or JSON.
- **Edit manually:** create clusters, methods, and connections from Library or an
  inspector; save the draft when ready.
- **Return later:** conversations persist locally, survive browser refresh, and
  support archive, restore, export, deletion, and cancellation.

See [the user guide](docs/USER_GUIDE.md) for session limits, backups, and examples,
[clustering and architecture decisions](docs/RESEARCH_DESIGN.md), and
[data handling](SECURITY.md). Native Windows is not supported by the current
process and file-lock implementation.

## Your first five minutes

1. Start the app and open the localhost URL printed in the terminal.
2. Click **Add paper**, paste an arXiv URL, choose an agent, and start the import.
3. Review the proposed paper, methods, cluster, and relationships. Accept the
   proposals you want, then **Save changes**.
4. Explore **3D universe** or **2D lineage** and click a paper to read its notes.
5. Open **Discuss** for a cited question, or import a second paper and open
   **Compare** for an evidence-backed comparison table.

Imports and research use your CLI account and can take a minute or more. You can
leave a view and return to the saved run. Answers depend on the available notes;
check the cited evidence before accepting proposed changes.

## Configure agents

The server discovers `codex` and `claude` on `PATH`. Install and sign in to at
least one before using AI features. For Codex:

```sh
npm install -g @openai/codex
codex
```

Complete the CLI sign-in once, then restart LitBench. See the official
[Codex setup guide](https://help.openai.com/en/articles/11096431) or
[Claude Code quickstart](https://code.claude.com/docs/en/quickstart) for installation
and account requirements. You only need one of the two agents.

Override executable paths when needed:

```sh
LITBENCH_CODEX=/path/to/codex LITBENCH_DEFAULT_AGENT=codex \
  python3 scripts/start.py
```

`LITBENCH_CLAUDE` selects a custom Claude Code executable. Restart the server
after changing agent configuration. One agent run operates at a time. Research
uses ephemeral CLI sessions with bounded context; LitBench owns the saved
conversation history.

## Update, back up, and troubleshoot

Stop the server with `Ctrl+C`, then update the application:

```sh
git pull --ff-only
python3 scripts/start.py --build
```

Your separate workspace remains in place. To back it up, stop the server and copy
its entire directory, including `data/` and `papers/`. Graph export alone does
not include conversation history.

- **Port already in use:** start with `--port 8001` and open that localhost URL.
- **Agent missing:** run `--doctor`, check CLI sign-in, and restart the server.
- **Usage limit:** resolve it in your agent account, then retry the operation.
- **No 3D support:** use the graph fallback or 2D lineage view.
- **Network access:** imports need access to paper sources; AI features need your
  provider. The local server is intended for your own computer.

## Develop and verify

```sh
npm ci
npm run verify
npx playwright install chromium
npm run test:e2e
```

For development, run `python3 tools/serve.py --workspace /path/to/dev-library`
and `npm run dev` in separate terminals. Vite proxies the API to port 8000.
Tests use synthetic fixtures and disposable workspaces. See
[contributing](CONTRIBUTING.md), [schema](docs/SCHEMA.md), and
[arXiv ingestion](docs/ARXIV_INGESTION.md).

## Share the application

```sh
python3 scripts/package_release.py --output release/litbench-source.zip
npm run build
python3 scripts/package_release.py --runtime --output release/litbench-runtime.zip
```

The archives contain a fresh empty library and exclude personal workspace data
and Git history. Start a new public repository from the source archive instead
of publishing an existing private history. [Distribution guide](docs/OPEN_SOURCE.md).

MIT licensed. See [LICENSE](LICENSE).
