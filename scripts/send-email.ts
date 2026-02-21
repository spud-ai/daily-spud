import { Resend } from 'resend';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseNewsletter, buildEmailHtml } from './lib/email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const PUBLIC_URL = 'https://dailyspud.colegottdank.com';
const TEMPLATE_PATH = '/Users/spud/.openclaw/workspace/skills/nano-banana-pro/briefing-template.html';
const RECIPIENTS = ['colegottdank@gmail.com'];

if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

// Use today's date dynamically, or accept a date argument
// Use local date (PST), not UTC — avoids date mismatch after 4pm PST
const targetDate = process.argv[2] || (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
})();
const filePath = path.join(__dirname, '../src/content/newsletters', `${targetDate}.md`);

if (!fs.existsSync(filePath)) {
  console.error(`Newsletter not found: ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');

// Parse frontmatter
const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
const fmMatch = content.match(frontmatterRegex);
const frontmatterRaw = fmMatch ? fmMatch[1] : '';
const bodyRaw = content.replace(frontmatterRegex, '').trim();

const titleMatch = frontmatterRaw.match(/title:\s*"(.*)"/);
const title = titleMatch ? titleMatch[1] : `The Daily Spud: ${targetDate}`;
const mainTitleMatch = title.match(/^The Daily Spud:\s*(.+)$/);
const mainTitle = mainTitleMatch ? mainTitleMatch[1] : title;

const { intro, stories, outro } = parseNewsletter(bodyRaw);
const formattedDate = new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric'
});

console.log(`Parsed: ${stories.length} stories, intro: ${intro.length} chars, outro: "${outro}"`);

// Check if today's email was already sent (prevent duplicate sends)
const lockDir = path.join(__dirname, '.locks');
const lockFile = path.join(lockDir, `sent-${targetDate}.lock`);
if (fs.existsSync(lockFile)) {
  console.log(`Already sent email for ${targetDate} — skipping (lock: ${lockFile})`);
  process.exit(0);
}

// Compress images before sending
const IMAGE_MAX_WIDTH = 600;
const projectRoot = path.join(__dirname, '..');

for (const story of stories) {
  if (!story.imageUrl.startsWith('/')) continue;
  const imgPath = path.join(projectRoot, 'public', story.imageUrl);
  if (!fs.existsSync(imgPath)) continue;

  const sizeKB = fs.statSync(imgPath).size / 1024;
  if (sizeKB > 150) {
    console.log(`Compressing ${path.basename(imgPath)} (${Math.round(sizeKB)}KB)...`);
    execSync(`sips --resampleWidth ${IMAGE_MAX_WIDTH} "${imgPath}"`, { stdio: 'pipe' });
    const newSize = Math.round(fs.statSync(imgPath).size / 1024);
    console.log(`  → ${newSize}KB`);
  }
}

// Read template and populate
if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`Template not found: ${TEMPLATE_PATH}`);
  process.exit(1);
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
const emailHtml = buildEmailHtml(template, {
  date: formattedDate,
  intro,
  stories,
  outro,
  publicUrl: PUBLIC_URL,
});

// Debug output
const debugPath = path.join(__dirname, 'debug-email.html');
fs.writeFileSync(debugPath, emailHtml);
console.log(`Debug HTML written to: ${debugPath}`);
console.log('✓ Template populated');

console.log(`\nSending email: "${title}" to ${RECIPIENTS.join(', ')}...`);

async function main() {
  try {
    const data = await resend.emails.send({
      from: 'The Daily Spud <spud@colegottdank.com>',
      to: RECIPIENTS,
      subject: `🥔 The Daily Spud: ${mainTitle}`,
      html: emailHtml,
    });
    console.log('Email sent successfully:', data);

    // Create lock file to prevent duplicate sends
    if (!fs.existsSync(lockDir)) fs.mkdirSync(lockDir, { recursive: true });
    fs.writeFileSync(lockFile, new Date().toISOString());
    console.log(`Lock created: ${lockFile}`);
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

main();
