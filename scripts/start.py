#!/usr/bin/env python3
"""Start LitBench on macOS or Linux, with a separate personal workspace."""
import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent


def default_workspace():
    base = (Path.home() / "Library/Application Support" if sys.platform == "darwin"
            else Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local/share")))
    return base / "LitBench/default"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=default_workspace())
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--build", action="store_true", help="Rebuild frontend after updating source")
    parser.add_argument("--doctor", action="store_true", help="Check prerequisites without starting")
    args = parser.parse_args()
    if sys.version_info < (3, 10):
        raise SystemExit("LitBench needs Python 3.10 or newer. Install a current Python and run this command again.")
    print(f"Python {sys.version.split()[0]} · {sys.platform}")
    print(f"Workspace: {args.workspace.expanduser().resolve()}")
    print(f"Frontend: {'ready' if (APP / 'dist/index.html').exists() else 'needs build'}")
    for name in ("codex", "claude"):
        configured = os.environ.get(f"LITBENCH_{name.upper()}")
        print(f"{name}: {configured or shutil.which(name) or 'not found (optional for browsing)'}")
    if args.doctor:
        print(f"Node: {shutil.which('node') or 'not found'}; npm: {shutil.which('npm') or 'not found'}")
        print("Sign in once with codex or claude before using AI features. No separate LitBench API key is required.")
        return
    if args.build or not (APP / "dist/index.html").exists():
        if not shutil.which("npm") or not shutil.which("node"):
            raise SystemExit("Source setup needs Node.js 20.19+ and npm. Install Node, or use the prebuilt runtime archive (Python + agent only).")
        version = subprocess.check_output(["node", "--version"], text=True).strip().lstrip("v")
        major, minor = map(int, version.split(".")[:2])
        if major < 20 or (major == 20 and minor < 19):
            raise SystemExit("Install Node.js 20.19 or newer to build LitBench.")
        subprocess.run(["npm", "ci", "--no-audit", "--no-fund"], cwd=APP, check=True)
        subprocess.run(["npm", "run", "build"], cwd=APP, check=True)
    os.execv(sys.executable, [sys.executable, str(APP / "tools/serve.py"),
                            "--workspace", str(args.workspace), "--port", str(args.port)])


if __name__ == "__main__":
    main()
