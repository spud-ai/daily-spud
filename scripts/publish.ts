import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { validateBriefingJson, briefingToMarkdown } from './lib/publish.js';
import { parseNewsletter, buildEmailHtml } from './lib/email.js';
import type { BriefingJson } from './lib/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.join(__dirname, '..');
const TEMPLATE_PATH = '/Users/spud/.openclaw/workspace/skills/nano-banana-pro/briefing-template.html';
const PUBLIC_URL = 'https://dailyspud.colegottdank.com';
const RECIPIENTS = ['colegottdank@gmail.com'];

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function fatal(msg: string): never {
  console.error(`[FATAL] ${msg}`);
  process.exit(1);
}

// --- Main ---
const jsonPath = process.argv[2];
if (!jsonPath) {
  fatal('Usage: npx tsx scripts/publish.ts <path-to-briefing.json>');
}

if (!fs.existsSync(jsonPath)) {
  fatal(`Briefing JSON not found: ${jsonPath}`);
}

// 1. Read and validate JSON
log(`Reading briefing from ${jsonPath}`);
let briefing: BriefingJson;
try {
  briefing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
} catch (e) {
  fatal(`Invalid JSON: ${(e as Error).message}`);
}

const validation = validateBriefingJson(briefing);
if (!validation.valid) {
  fatal(`Invalid briefing:\n  - ${validation.errors.join('\n  - ')}`);
}
log(`Validated: "${briefing.title}" with ${briefing.stories.length} stories`);

// 2. Template markdown
const markdown = briefingToMarkdown(briefing);
const mdPath = path.join(PROJECT_DIR, 'src/content/newsletters', `${briefing.date}.md`);
fs.writeFileSync(mdPath, markdown);
log(`Wrote markdown: ${mdPath}`);

// 3. Git add, commit, push
try {
  const imgDir = path.join(PROJECT_DIR, `public/images/${briefing.date}`);
  const filesToAdd = [mdPath];
  if (fs.existsSync(imgDir)) {
    filesToAdd.push(imgDir);
  }

  execSync(`git add ${filesToAdd.map(f => `"${f}"`).join(' ')}`, { cwd: PROJECT_DIR, stdio: 'pipe' });
  execSync(`git commit -m "Add newsletter ${briefing.date}"`, { cwd: PROJECT_DIR, stdio: 'pipe' });
  execSync('git push', { cwd: PROJECT_DIR, stdio: 'pipe' });
  log('Git: committed and pushed');
} catch (e) {
  log(`Git warning: ${(e as Error).message}`);
}

// 4. Build site
log('Building site...');
try {
  execSync('npm run build', { cwd: PROJECT_DIR, stdio: 'pipe' });
  log('Build succeeded');
} catch (e) {
  fatal(`Build failed: ${(e as Error).message}`);
}

// 5. Restart PM2
try {
  execSync('pm2 restart daily-spud', { stdio: 'pipe' });
  log('PM2: restarted daily-spud');
} catch (e) {
  log(`PM2 warning: ${(e as Error).message}`);
}

// 6. Send email
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  log('RESEND_API_KEY not set — skipping email');
} else {
  // Check lock file
  const lockDir = path.join(__dirname, '.locks');
  const lockFile = path.join(lockDir, `sent-${briefing.date}.lock`);
  if (fs.existsSync(lockFile)) {
    log(`Email already sent for ${briefing.date} — skipping`);
  } else {
    log('Sending email...');

    // Compress images
    const IMAGE_MAX_WIDTH = 600;
    const bodyRaw = markdown.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
    const parsed = parseNewsletter(bodyRaw);

    for (const story of parsed.stories) {
      if (!story.imageUrl.startsWith('/')) continue;
      const imgPath = path.join(PROJECT_DIR, 'public', story.imageUrl);
      if (!fs.existsSync(imgPath)) continue;
      const sizeKB = fs.statSync(imgPath).size / 1024;
      if (sizeKB > 150) {
        log(`Compressing ${path.basename(imgPath)} (${Math.round(sizeKB)}KB)...`);
        execSync(`sips --resampleWidth ${IMAGE_MAX_WIDTH} "${imgPath}"`, { stdio: 'pipe' });
        const newSize = Math.round(fs.statSync(imgPath).size / 1024);
        log(`  -> ${newSize}KB`);
      }
    }

    // Build email HTML
    if (!fs.existsSync(TEMPLATE_PATH)) {
      fatal(`Email template not found: ${TEMPLATE_PATH}`);
    }
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const formattedDate = new Date(briefing.date + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    const emailHtml = buildEmailHtml(template, {
      date: formattedDate,
      intro: parsed.intro,
      stories: parsed.stories,
      outro: parsed.outro,
      publicUrl: PUBLIC_URL,
    });

    // Send via Resend
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);
    try {
      const data = await resend.emails.send({
        from: 'The Daily Spud <spud@colegottdank.com>',
        to: RECIPIENTS,
        subject: `🥔 The Daily Spud: ${briefing.title}`,
        html: emailHtml,
      });
      log(`Email sent: ${JSON.stringify(data)}`);

      // Create lock
      if (!fs.existsSync(lockDir)) fs.mkdirSync(lockDir, { recursive: true });
      fs.writeFileSync(lockFile, new Date().toISOString());
      log(`Lock created: ${lockFile}`);
    } catch (e) {
      fatal(`Email send failed: ${(e as Error).message}`);
    }
  }
}

// 7. Update history file (for cron job reference)
const historyPath = path.join(PROJECT_DIR, '.last-published');
fs.writeFileSync(historyPath, `${briefing.date}\n${new Date().toISOString()}\n`);
log(`Done! Published ${briefing.date}`);
