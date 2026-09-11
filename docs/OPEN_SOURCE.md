# Distributing LitBench

Publish application code, prompts, schema/architecture documentation, launcher,
release tooling, dependency lockfile, tests with synthetic fixtures, CI, and the
MIT license. No separately installed agent skill is needed: the app ships its
insertion and research prompts and the validated CLI bridge.

Do not publish a personal workspace or reuse Git history that contains private
paper notes, sessions, imports, or credentials. A `.gitignore` does not remove
already tracked files or historical commits.

Create a clean source archive:

```sh
python3 scripts/package_release.py --output release/litbench-source.zip
```

Unpack that archive into a new directory and initialize a fresh Git repository
there for public release. The packager uses an application file allowlist and
creates an empty default graph. It excludes personal data, source PDFs, sessions,
temporary runs, credentials, dependencies, and Git history. Test fixtures contain
synthetic notes and feed records; familiar public paper metadata is used only to
exercise display and relationships.

For users who should not need Node.js:

```sh
npm run build
python3 scripts/package_release.py --runtime --output release/litbench-runtime.zip
```

The runtime includes compiled frontend assets, Python tools, documentation, and
prompts. Users unzip it, install Python 3.10+ and a supported agent CLI, sign in,
and run `python3 scripts/start.py`. A browser opens the localhost application.
The launcher prints its URL; it does not install agents or open the browser.
To upgrade, unpack new application files and point the launcher at the existing
personal workspace. Stop the previous server and back up that workspace first.

The source contains a macOS/Linux CI matrix. Hosted CI and live Claude Code
verification require those environments/accounts; local fixture tests do not
claim a successful live provider call. Keep an explicit release verification
record identifying the platforms and providers actually exercised.
