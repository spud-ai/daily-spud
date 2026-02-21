import type { BriefingJson } from './types.js';

export function templateMarkdown(briefing: BriefingJson): string {
  const { date, title, intro, stories, outro } = briefing;

  // Escape double quotes in title for YAML frontmatter
  const escapedTitle = title.replace(/"/g, '\\"');
  const frontmatterImage = stories.length > 0 ? stories[0].imagePath : '';

  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`title: "The Daily Spud: ${escapedTitle}"`);
  lines.push(`date: ${date}`);
  lines.push(`image: "${frontmatterImage}"`);
  lines.push('---');
  lines.push('');

  // Intro
  lines.push(intro);
  lines.push('');

  // Stories
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];

    lines.push('---');
    lines.push('');
    lines.push(`### ${story.headline}`);
    lines.push('');
    lines.push(story.body);
    lines.push('');
    lines.push(`[Source: ${story.sourceName} →](${story.sourceUrl})`);
    lines.push('');
    lines.push(`![${story.headline}](${story.imagePath})`);
    lines.push('');
  }

  // Divider before outro
  lines.push('---');
  lines.push('');

  // Outro (if present)
  if (outro) {
    lines.push(outro);
    lines.push('');
  }

  // Signature
  lines.push('*\u2014 Spud \u{1F954}*');
  lines.push('');
  lines.push('*AI-generated editorial cartoons by Gemini \u00D7 The Spud Style*');
  lines.push('*Delivered by OpenClaw*');
  lines.push(''); // trailing newline

  return lines.join('\n');
}
