#!/bin/sh
# One-command setup and launch on macOS and Linux. No sudo or shell-profile edits.
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
case "$(uname -s)" in
  Darwin|Linux) ;;
  *) echo "LitBench currently supports macOS and Linux." >&2; exit 1 ;;
esac
if command -v uv >/dev/null 2>&1; then
  LITBENCH_UV=$(command -v uv)
else
  LITBENCH_UV="$APP_DIR/.litbench/uv/uv"
  if [ ! -x "$LITBENCH_UV" ]; then
    echo "Setting up uv for LitBench (one time)…"
    mkdir -p "$APP_DIR/.litbench"
    if ! command -v curl >/dev/null 2>&1; then
      echo "Install curl, or install uv from https://docs.astral.sh/uv/, then retry." >&2
      exit 1
    fi
    curl --proto '=https' --tlsv1.2 -fLsS https://astral.sh/uv/install.sh -o "$APP_DIR/.litbench/install-uv.sh"
    UV_UNMANAGED_INSTALL="$APP_DIR/.litbench/uv" sh "$APP_DIR/.litbench/install-uv.sh"
  fi
fi
cd "$APP_DIR"
exec "$LITBENCH_UV" run --locked --python 3.12 python -u scripts/start.py "$@"
