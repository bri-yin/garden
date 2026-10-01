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
BRANCH="$(git branch --show-current)"
if [[ -z "$BRANCH" ]]; then
  echo "Garden is not on a branch; stopping without pushing." >&2
  exit 1
fi

git add -A -- content quartz.config.ts .github/workflows/deploy.yml scripts/sync-and-publish.sh
if ! git diff --cached --quiet; then
  git commit -m "Publish Obsidian garden" >/dev/null
fi

for attempt in 1 2 3; do
  git fetch origin
  git rebase "origin/$BRANCH"

  read -r behind ahead < <(git rev-list --left-right --count "origin/$BRANCH...HEAD")
  if (( ahead == 0 )); then
    echo "Garden is already up to date; nothing to push."
    exit 0
  fi

  if git push origin "HEAD:refs/heads/$BRANCH" >/dev/null; then
    echo "Garden changes pushed; GitHub Actions is deploying them."
    exit 0
  fi

  echo "GitHub changed during the push; retrying ($attempt/3)." >&2
done

echo "Could not push the garden after three tries." >&2
exit 1
