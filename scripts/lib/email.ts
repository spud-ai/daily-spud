import type { ParsedStory, ParsedNewsletter } from './types.js';

const DEFAULT_PUBLIC_URL = 'https://dailyspud.colegottdank.com';

export function parseNewsletter(markdown: string): ParsedNewsletter {
  const sections = markdown.split(/^---+$/m).map(s => s.trim()).filter(Boolean);

  const intro = sections[0] || '';
  const stories: ParsedStory[] = [];
  let outro = '';

  let storyNumber = 1;
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];

    const headlineMatch = section.match(/^###\s+(?:\d+\.\s*)?(.+)$/m);
    if (!headlineMatch) {
      // No headline — this is the outro/sign-off section
      outro = section
        .replace(/^\*?—.*$/m, '')
        .replace(/^\*AI-generated.*$/m, '')
        .replace(/^\*Delivered by.*$/m, '')
        .trim();
      continue;
    }

    const headline = headlineMatch[1];
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

export function buildStoryBlocks(stories: ParsedStory[], publicUrl: string = DEFAULT_PUBLIC_URL): string {
  return stories.map((story, i) => {
    const absoluteUrl = story.imageUrl.startsWith('/')
      ? `${publicUrl}${story.imageUrl}`
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

export interface EmailData {
  date: string;
  intro: string;
  stories: ParsedStory[];
  outro: string;
  publicUrl?: string;
}

export function buildEmailHtml(template: string, data: EmailData): string {
  const { date, intro, stories, outro, publicUrl } = data;

  let html = template;

  // Replace the story comment block with actual story HTML
  const storyCommentRegex = /<!-- STORY BLOCK \(repeat for each story\) -->[\s\S]*?-->/;
  html = html.replace(storyCommentRegex, buildStoryBlocks(stories, publicUrl));

  // Replace placeholders
  html = html.replace('{{DATE}}', date);
  html = html.replace('{{INTRO}}', intro);
  html = html.replace('{{OUTRO}}', outro);

  return html;
}
