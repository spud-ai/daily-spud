#!/bin/bash
# Usage: ./generate-image.sh "prompt text" /path/to/output.png
# Generates an image using Gemini 3 Pro and saves it as PNG.

set -e

PROMPT="$1"
OUTPUT="$2"
API_KEY="${GEMINI_API_KEY:-AIzaSyCeGB3mg04v1QDWDtNsblyvLxPg_8d0QYs}"

if [ -z "$PROMPT" ] || [ -z "$OUTPUT" ]; then
  echo "Usage: $0 \"prompt\" /path/to/output.png" >&2
  exit 1
fi

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT")"

# Append The Spud Style suffix if not already present
if ! echo "$PROMPT" | grep -q "Vintage editorial cartoon"; then
  PROMPT="$PROMPT. Vintage editorial cartoon style, muted warm color palette of cream rust and olive green, crosshatch ink shading, aged paper texture, charming expressive characters, witty and absurdist, clean comic panel composition"
fi

# Escape prompt for JSON
JSON_PROMPT=$(python3 -c "import json; print(json.dumps($( python3 -c "import sys; print(repr('$PROMPT'))" 2>/dev/null || echo \"$PROMPT\" )))" 2>/dev/null)
# Fallback: simple escape
if [ -z "$JSON_PROMPT" ]; then
  JSON_PROMPT=$(echo "$PROMPT" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))")
fi

RESPONSE=$(curl -s --max-time 60 \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"contents\": [{
      \"parts\": [{\"text\": $JSON_PROMPT}]
    }],
    \"generationConfig\": {
      \"responseModalities\": [\"image\", \"text\"]
    }
  }")

# Extract base64 image data and decode to PNG
echo "$RESPONSE" | python3 -c "
import json, sys, base64
data = json.load(sys.stdin)
candidates = data.get('candidates', [])
if not candidates:
    error = data.get('error', {})
    print(f'ERROR: {error.get(\"message\", \"No candidates in response\")}', file=sys.stderr)
    print(json.dumps(data, indent=2)[:300], file=sys.stderr)
    sys.exit(1)
for part in candidates[0].get('content', {}).get('parts', []):
    if 'inlineData' in part:
        img = base64.b64decode(part['inlineData']['data'])
        with open('$OUTPUT', 'wb') as f:
            f.write(img)
        print(f'OK: $(basename "$OUTPUT") ({len(img)} bytes)')
        sys.exit(0)
print('ERROR: No image data in response', file=sys.stderr)
sys.exit(1)
"
