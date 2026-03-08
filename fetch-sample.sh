#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  echo "Usage: ./fetch-sample.sh <furaffinity-url>"
  echo "Example: ./fetch-sample.sh https://www.furaffinity.net/view/12345/"
  echo ""
  echo "Requires SESSION_A and SESSION_B environment variables."
  exit 1
fi

url="$1"

if [[ -z "${SESSION_A:-}" || -z "${SESSION_B:-}" ]]; then
  echo "Error: SESSION_A and SESSION_B environment variables must be set."
  exit 1
fi

# Extract a directory name from the URL path (e.g. /view/12345/ -> view-12345)
dir_name=$(echo "$url" | sed -E 's|https?://[^/]+/||; s|/+$||; s|/|-|g')

if [[ -z "$dir_name" ]]; then
  echo "Error: could not derive directory name from URL."
  exit 1
fi

output_dir="sample-files/$dir_name"
mkdir -p "$output_dir"

echo "Fetching $url -> $output_dir/page.html"
curl -sS -b "a=$SESSION_A; b=$SESSION_B" -o "$output_dir/page.html" "$url"
echo "Done."
