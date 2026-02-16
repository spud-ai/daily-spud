import { Resend } from 'resend';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const targetDate = process.argv[2] || new Date().toISOString().split('T')[0];
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

// Parse markdown into structured data
interface Story {
  number: number;
  headline: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl: string;
  altText: string;
}

function parseNewsletter(markdown: string): { intro: string; stories: Story[]; outro: string } {
  // Split on --- dividers
  const sections = markdown.split(/^---+$/m).map(s => s.trim()).filter(Boolean);

  const intro = sections[0] || '';
  const stories: Story[] = [];
  let outro = '';

  let storyNumber = 1;
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];

    // Check if this section has a headline (### ...) — if so, it's a story
    const headlineMatch = section.match(/^###\s+(?:\d+\.\s*)?(.+)$/m);
    if (!headlineMatch) {
      // No headline — this is the outro/sign-off section
      // Strip the signature lines since the template handles those
      outro = section
        .replace(/^\*?—.*$/m, '')
        .replace(/^\*AI-generated.*$/m, '')
        .replace(/^\*Delivered by.*$/m, '')
        .trim();
      continue;
    }

    const headline = headlineMatch[1];

    // Extract summary (text between headline and source/image lines)
    const lines = section.split('\n');
    const summaryLines: string[] = [];
    let sourceUrl = '';
    let sourceName = '';
    let imageUrl = '';
    let altText = '';
    let pastHeadline = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^###\s+/.test(trimmed)) {
        pastHeadline = true;
        continue;
      }
      if (!pastHeadline || !trimmed) continue;

      const srcMatch = trimmed.match(/^\[Source:\s*(.+?)\s*→\]\((.+?)\)$/);
      if (srcMatch) {
        sourceName = srcMatch[1];
        sourceUrl = srcMatch[2];
        continue;
      }

      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        altText = imgMatch[1];
        imageUrl = imgMatch[2];
        continue;
      }

      summaryLines.push(trimmed);
    }

    stories.push({
      number: storyNumber++,
      headline,
      summary: summaryLines.join(' '),
      sourceUrl,
      sourceName,
      imageUrl,
      altText,
    });
  }

  return { intro, stories, outro };
}

const { intro, stories, outro } = parseNewsletter(bodyRaw);
const formattedDate = new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric'
});

console.log(`Parsed: ${stories.length} stories, intro: ${intro.length} chars, outro: "${outro}"`);

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

// Build story HTML blocks from template
function buildStoryBlocks(stories: Story[]): string {
  return stories.map((story, i) => {
    const absoluteUrl = story.imageUrl.startsWith('/')
      ? `${PUBLIC_URL}${story.imageUrl}`
      : story.imageUrl;

    const isLast = i === stories.length - 1;

    return `
<tr><td style="padding:0 40px;">
<img src="${absoluteUrl}" width="560" style="width:100%; max-width:560px; border-radius:4px; border:1px solid #d4c4a8;" alt="${story.altText}">
<h2 style="color:#8b2500; font-size:22px; margin:16px 0 8px; line-height:1.3;">${story.number}. ${story.headline}</h2>
<p style="color:#4a3728; font-size:15px; line-height:1.6; margin:0 0 8px;">
${story.summary}
</p>
<p style="margin:0 0 16px;"><a href="${story.sourceUrl}" style="color:#8b5e3c; font-size:13px;">Source: ${story.sourceName} →</a></p>
</td></tr>${isLast ? '' : `

<tr><td style="padding:0 40px;"><hr style="border:none; border-top:1px dashed #c4a882; margin:20px 0;"></td></tr>`}`;
  }).join('\n');
}

// Read template and populate
if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`Template not found: ${TEMPLATE_PATH}`);
  process.exit(1);
}

let emailHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

// Replace the comment block with actual story HTML
const storyCommentRegex = /<!-- STORY BLOCK \(repeat for each story\) -->[\s\S]*?-->/;
emailHtml = emailHtml.replace(storyCommentRegex, buildStoryBlocks(stories));

// Replace placeholders
emailHtml = emailHtml.replace('{{DATE}}', formattedDate);
emailHtml = emailHtml.replace('{{INTRO}}', intro);
emailHtml = emailHtml.replace('{{OUTRO}}', outro);

// Debug output
const debugPath = path.join(__dirname, 'debug-email.html');
fs.writeFileSync(debugPath, emailHtml);
console.log(`Debug HTML written to: ${debugPath}`);
console.log('✓ Template populated');

console.log(`\nSending email: "${title}" to ${RECIPIENTS.join(', ')}...`);

async function main() {
  try {
    const data = await resend.emails.send({
      from: 'Spud <spud@resend.dev>',
      to: RECIPIENTS,
      subject: `🥔 The Daily Spud: ${mainTitle}`,
      html: emailHtml,
    });
    console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

main();
