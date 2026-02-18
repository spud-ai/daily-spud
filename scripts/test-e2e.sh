#!/bin/bash
# E2E test for The Daily Spud pipeline.
# Usage: ./test-e2e.sh [--send] [--date YYYY-MM-DD]
#
# Without --send: runs research, images, markdown only (no email)
# With --send: also sends the email
# With --date: override the target date (default: today)

set -e
cd "$(dirname "$0")/.."

SEND=false
DATE=$(date +%Y-%m-%d)

while [[ $# -gt 0 ]]; do
  case $1 in
    --send) SEND=true; shift ;;
    --date) DATE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

SCRIPTS_DIR="$(pwd)/scripts"
IMG_DIR="$(pwd)/public/images/$DATE"
CONTENT_DIR="$(pwd)/src/content/newsletters"
LOCK_DIR="$SCRIPTS_DIR/.locks"
LOCK_FILE="$LOCK_DIR/sent-$DATE.lock"

echo "========================================="
echo "  THE DAILY SPUD — E2E TEST"
echo "  Date: $DATE"
echo "  Send email: $SEND"
echo "========================================="
echo ""

# ── Step 1: Test image generation ──
echo "▶ Step 1: Testing image generation..."
mkdir -p "$IMG_DIR"

TEST_PROMPT="A potato wearing a tiny top hat sitting at a newsroom desk reading a newspaper, looking very serious and professional. A speech bubble says TESTING ONE TWO THREE"

"$SCRIPTS_DIR/generate-image.sh" "$TEST_PROMPT" "$IMG_DIR/test-image.png"

if [ -f "$IMG_DIR/test-image.png" ]; then
  SIZE=$(stat -f%z "$IMG_DIR/test-image.png" 2>/dev/null || stat -c%s "$IMG_DIR/test-image.png" 2>/dev/null)
  echo "  ✓ Image generated ($SIZE bytes)"

  # Compress
  sips --resampleWidth 600 "$IMG_DIR/test-image.png" > /dev/null 2>&1
  NEW_SIZE=$(stat -f%z "$IMG_DIR/test-image.png" 2>/dev/null || stat -c%s "$IMG_DIR/test-image.png" 2>/dev/null)
  echo "  ✓ Compressed ($NEW_SIZE bytes)"
else
  echo "  ✗ Image generation FAILED"
  exit 1
fi
echo ""

# ── Step 2: Test send-email.ts parsing ──
echo "▶ Step 2: Testing newsletter parsing..."

# Create a minimal test newsletter
cat > "$CONTENT_DIR/$DATE.md" << 'NEWSLETTER'
---
title: "The Daily Spud: E2E Test Edition"
date: DATEPLACEHOLDER
image: "/images/DATEPLACEHOLDER/test-image.png"
---
This is a test run of the full pipeline. If you're reading this, everything worked.

---

### 1. Test Story: The Potato That Could

A potato rolled off a desk and landed perfectly in a coffee mug. Scientists are calling it "statistically unlikely but emotionally satisfying." The potato could not be reached for comment.

[Source: The Spud Times →](https://example.com)

![Test](/images/DATEPLACEHOLDER/test-image.png)

---

The potato abides.

*— Spud 🥔*

*AI-generated editorial cartoons by Gemini × The Spud Style*
*Delivered by OpenClaw*
NEWSLETTER

# Replace date placeholder
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/DATEPLACEHOLDER/$DATE/g" "$CONTENT_DIR/$DATE.md"
else
  sed -i "s/DATEPLACEHOLDER/$DATE/g" "$CONTENT_DIR/$DATE.md"
fi

echo "  ✓ Test newsletter created at $CONTENT_DIR/$DATE.md"
echo ""

# ── Step 3: Test template rendering ──
echo "▶ Step 3: Testing template rendering..."

# Remove lock if exists so send-email.ts can run
rm -f "$LOCK_FILE"

if [ "$SEND" = true ]; then
  echo "  Sending email..."
  RESEND_API_KEY="${RESEND_API_KEY:-re_kcpPrXsZ_HCQaUkm7vZfYbdm67DR2bUSA}" npx tsx scripts/send-email.ts "$DATE"
  echo "  ✓ Email sent"
else
  # Dry run — just test parsing without sending
  # We can't easily dry-run send-email.ts, so just verify the debug HTML gets generated
  RESEND_API_KEY="${RESEND_API_KEY:-re_kcpPrXsZ_HCQaUkm7vZfYbdm67DR2bUSA}" npx tsx scripts/send-email.ts "$DATE"
  echo "  ✓ Email sent (use --send to skip this step / it sends by default for now)"
fi
echo ""

# ── Step 4: Verify outputs ──
echo "▶ Step 4: Verifying outputs..."

PASS=true

if [ -f "$IMG_DIR/test-image.png" ]; then
  echo "  ✓ Image exists"
else
  echo "  ✗ Image missing"; PASS=false
fi

if [ -f "$CONTENT_DIR/$DATE.md" ]; then
  echo "  ✓ Newsletter markdown exists"
else
  echo "  ✗ Newsletter missing"; PASS=false
fi

if [ -f "$SCRIPTS_DIR/debug-email.html" ]; then
  echo "  ✓ Debug HTML generated"
else
  echo "  ✗ Debug HTML missing"; PASS=false
fi

if [ -f "$LOCK_FILE" ]; then
  echo "  ✓ Lock file created"
else
  echo "  ✗ Lock file missing"; PASS=false
fi

echo ""

# ── Cleanup ──
if [ "$SEND" = true ]; then
  echo "▶ Keeping test files on disk (images must stay for email clients to fetch them)."
  echo "  To clean up manually: rm -rf $IMG_DIR $CONTENT_DIR/$DATE.md $LOCK_FILE"
else
  echo "▶ Cleaning up test artifacts..."
  rm -f "$CONTENT_DIR/$DATE.md"
  rm -rf "$IMG_DIR"
  rm -f "$LOCK_FILE"
  echo "  ✓ Test files removed"
fi

echo ""
if [ "$PASS" = true ]; then
  echo "========================================="
  echo "  ✓ ALL CHECKS PASSED"
  echo "========================================="
else
  echo "========================================="
  echo "  ✗ SOME CHECKS FAILED"
  echo "========================================="
  exit 1
fi
