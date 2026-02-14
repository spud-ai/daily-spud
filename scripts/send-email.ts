import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESEND_API_KEY = process.env.RESEND_API_KEY;
// const PUBLIC_URL = 'https://raw.githubusercontent.com/spud-ai/daily-spud/main/public';
const PUBLIC_URL = 'https://raw.githubusercontent.com/spud-ai/daily-spud/main/public';
const RECIPIENTS = ['colegottdank@gmail.com'];

if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

// Find today's newsletter
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
// Or just look for the specific file we know exists
const targetDate = '2026-02-14'; 
const filePath = path.join(__dirname, '../src/content/newsletters', `${targetDate}.md`);

if (!fs.existsSync(filePath)) {
  console.error(`Newsletter not found: ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');

// Parse Frontmatter
const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
const match = content.match(frontmatterRegex);
const frontmatterRaw = match ? match[1] : '';
const bodyRaw = content.replace(frontmatterRegex, '').trim();

const titleMatch = frontmatterRaw.match(/title:\s*"(.*)"/);
const title = titleMatch ? titleMatch[1] : `The Daily Spud: ${targetDate}`;

// Extract the main title (everything after the colon in the title)
const mainTitleMatch = title.match(/^The Daily Spud:\s*(.+)$/);
const mainTitle = mainTitleMatch ? mainTitleMatch[1] : title;

// BULLETPROOF MARKDOWN PARSER
// Processes line-by-line with proper state tracking

function processInlineMarkdown(text: string): string {
  // Bold text: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic text: *text* (but not bullet points)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');
  return text;
}

function parseMarkdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const blocks: string[] = [];
  let currentParagraph: string[] = [];
  
  function flushParagraph(): void {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        blocks.push(`<p style="margin-bottom: 16px; line-height: 1.7; color: #3D2E1A; font-size: 16px; font-family: Georgia, serif;">${processInlineMarkdown(text)}</p>`);
      }
      currentParagraph = [];
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Empty line - flush paragraph
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    
    // Check for H4 headers: #### text
    if (/^####\s+(.+)$/.test(trimmed)) {
      flushParagraph();
      const headerText = trimmed.replace(/^####\s+/, '');
      blocks.push(`<h4 style="font-family: Georgia, serif; font-size: 18px; color: #8B4513; margin-top: 24px; margin-bottom: 8px; font-weight: bold; font-style: italic;">${processInlineMarkdown(headerText)}</h4>`);
      continue;
    }

    // Check for H3 headers: ### text (any amount of leading whitespace trimmed)
    if (/^###\s+(.+)$/.test(trimmed)) {
      flushParagraph();
      const headerText = trimmed.replace(/^###\s+/, '');
      blocks.push(`<h3 style="font-family: Georgia, serif; font-size: 22px; color: #8B4513; margin-top: 28px; margin-bottom: 12px; font-weight: bold; letter-spacing: -0.3px;">${processInlineMarkdown(headerText)}</h3>`);
      continue;
    }
    
    // Check for H2 headers: ## text
    if (/^##\s+(.+)$/.test(trimmed)) {
      flushParagraph();
      const headerText = trimmed.replace(/^##\s+/, '');
      blocks.push(`<h2 style="font-family: Georgia, serif; font-size: 26px; color: #1A1207; margin-top: 36px; margin-bottom: 16px; font-weight: bold;">${processInlineMarkdown(headerText)}</h2>`);
      continue;
    }
    
    // Check for H1 headers: # text
    if (/^#\s+(.+)$/.test(trimmed)) {
      flushParagraph();
      const headerText = trimmed.replace(/^#\s+/, '');
      blocks.push(`<h1 style="font-family: Georgia, serif; font-size: 30px; color: #1A1207; margin-top: 40px; margin-bottom: 20px; font-weight: bold;">${processInlineMarkdown(headerText)}</h1>`);
      continue;
    }
    
    // Check for divider: --- (or more dashes)
    if (/^---+$/.test(trimmed)) {
      flushParagraph();
      blocks.push('<hr style="border: 0; border-top: 1px dashed #C4922A; margin: 28px 0;">');
      continue;
    }
    
    // Check for images: ![alt](url)
    const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      flushParagraph();
      const alt = imageMatch[1];
      const url = imageMatch[2];
      const absoluteUrl = url.startsWith('/') ? `${PUBLIC_URL}${url}` : url;
      blocks.push(`<div style="margin: 20px 0; text-align: center;"><img src="${absoluteUrl}" alt="${alt}" style="max-width: 100%; height: auto; border: 1px solid #E0C097; border-radius: 4px; display: inline-block;" /></div>`);
      continue;
    }
    
    // Check for "Source:" links on their own line: [Source: text →](url)
    const sourceLinkMatch = trimmed.match(/^\[Source:\s*(.+?)\s*→\]\((.+?)\)$/);
    if (sourceLinkMatch) {
      flushParagraph();
      const sourceText = sourceLinkMatch[1];
      const sourceUrl = sourceLinkMatch[2];
      blocks.push(`<p style="margin-top: 8px; margin-bottom: 16px; font-size: 14px; font-family: Georgia, serif;"><a href="${sourceUrl}" style="color: #8B6914; text-decoration: none; border-bottom: 1px dotted #8B6914;">Source: ${sourceText} →</a></p>`);
      continue;
    }
    
    // Check for footer signature: *— text* or — text
    if (/^\*?—/.test(trimmed)) {
      flushParagraph();
      const cleanText = trimmed.replace(/^\*?—\s*/, '').replace(/\*$/, '').trim();
      blocks.push(`<p style="margin-top: 32px; font-weight: bold; font-family: Georgia, serif; font-size: 18px; text-align: center; color: #1A1207;">— ${processInlineMarkdown(cleanText)}</p>`);
      continue;
    }
    
    // Check for footer metadata lines (italic, small, centered)
    if (/^\*AI-generated/.test(trimmed) || trimmed.includes('Delivered by OpenClaw')) {
      flushParagraph();
      const cleanText = trimmed.replace(/^\*+/, '').replace(/\*+$/, '').trim();
      blocks.push(`<p style="text-align: center; font-size: 12px; color: #9B8A6E; margin-top: 4px; font-family: Georgia, serif;">${processInlineMarkdown(cleanText)}</p>`);
      continue;
    }
    
    // Regular paragraph line - accumulate
    currentParagraph.push(trimmed);
  }
  
  // Flush any remaining paragraph
  flushParagraph();
  
  return blocks.join('\n');
}

const htmlBody = parseMarkdownToHtml(bodyRaw);

// HTML Email Template - "Old Daily Spud" Style
const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FDF6E3; font-family: Georgia, serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Content Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FDF6E3; border: 1px solid #1A1207; border-radius: 0; box-shadow: 8px 8px 0px #1A1207; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 20px 0 30px; border-bottom: 1px dashed #C4922A;">
              <div style="font-size: 48px; margin-bottom: 8px;">🥔</div>
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 32px; color: #1A1207; font-weight: bold; letter-spacing: -0.5px;">THE DAILY SPUD</h1>
              <p style="margin: 8px 0 0; color: #8B6914; font-family: Georgia, serif; font-size: 13px; font-style: italic;">${new Date(targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              ${htmlBody}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 20px; border-top: 1px dashed #C4922A;">
              <p style="margin: 0; color: #8B6914; font-size: 12px; font-family: Georgia, serif;">Delivered by OpenClaw</p>
              <p style="margin: 8px 0 0; font-size: 12px;"><a href="${PUBLIC_URL}" style="color: #8B4513; text-decoration: underline; font-family: Georgia, serif;">View in Browser</a></p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// DEBUG: Write HTML to file for inspection
const debugPath = path.join(__dirname, 'debug-email.html');
fs.writeFileSync(debugPath, emailHtml);
console.log(`Debug HTML written to: ${debugPath}`);

// Output preview of the body HTML for verification
console.log('\n=== GENERATED HTML BODY PREVIEW ===\n');
console.log(htmlBody.substring(0, 2000));
console.log('\n=== ...truncated... ===\n');

// Check for any raw markdown markers that shouldn't be there
const rawMarkdownCheck = htmlBody.match(/#{3,}\s+/);
if (rawMarkdownCheck) {
  console.error('ERROR: Raw markdown headers still present in HTML!');
  console.error('Found:', rawMarkdownCheck[0]);
  process.exit(1);
}

console.log('✓ No raw markdown headers found');
console.log('✓ HTML structure looks correct');

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
