#!/usr/bin/env bash
set -euo pipefail

# Obsidian launched from Finder may not inherit Homebrew's PATH.
export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/bin:/bin:/usr/sbin:/sbin${PATH:+:$PATH}"

ROOT="/Users/brianyin/garden"
SOURCE="/Users/brianyin/Documents/Obsidian/brian-vault/Public/"
DEST="$ROOT/content/"

if [[ ! -s "$SOURCE/index.md" ]]; then
  echo "Public/index.md is missing; stopping without changing the published source." >&2
  exit 1
fi

mkdir -p "$DEST"
rsync -a --delete --exclude='.DS_Store' "$SOURCE" "$DEST"

cd "$ROOT"
git add -A -- content quartz.config.ts .github/workflows/deploy.yml scripts/sync-and-publish.sh
if git diff --cached --quiet; then
  echo "No public garden changes to publish."
  exit 0
fi

git commit -m "Publish Obsidian garden" >/dev/null
git push origin HEAD >/dev/null
echo "Garden changes pushed; GitHub Actions is deploying them."
