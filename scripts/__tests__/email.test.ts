import { describe, it, expect } from 'vitest';
import { parseNewsletter, buildStoryBlocks, buildEmailHtml } from '../lib/email.js';
import type { ParsedNewsletter } from '../lib/types.js';

const sampleMarkdown = `Today's AI news reads like a therapy session for tech executives.

---

### Thousands of CEOs Admit AI Has Zero Impact

In a stunning display of corporate honesty, a major study has revealed that CEOs now admit AI has had **no measurable impact**.

[Source: Fortune →](https://fortune.com/2026/02/17/ai-study)

![CEOs staring at blank screens](/images/2026-02-18/story-1.png)

---

### Claude Sonnet 4.6 Arrives

Anthropic quietly dropped Claude Sonnet 4.6, and the crowd responded.

[Source: Anthropic →](https://www.anthropic.com/news/claude-sonnet-4-6)

![Claude painting](/images/2026-02-18/story-2.png)

---

**The Closing Peel:** Today's news perfectly captures the absurdity of the moment.

*— Spud 🥔*

*AI-generated editorial cartoons by Gemini × The Spud Style*
*Delivered by OpenClaw*`;

describe('parseNewsletter', () => {
  it('extracts intro text', () => {
    const result = parseNewsletter(sampleMarkdown);
    expect(result.intro).toBe("Today's AI news reads like a therapy session for tech executives.");
  });

  it('extracts correct number of stories', () => {
    const result = parseNewsletter(sampleMarkdown);
    expect(result.stories).toHaveLength(2);
  });

  it('parses story headlines', () => {
    const result = parseNewsletter(sampleMarkdown);
    expect(result.stories[0].headline).toBe('Thousands of CEOs Admit AI Has Zero Impact');
    expect(result.stories[1].headline).toBe('Claude Sonnet 4.6 Arrives');
  });

  it('parses story summaries (body text)', () => {
    const result = parseNewsletter(sampleMarkdown);
    expect(result.stories[0].summary).toContain('stunning display of corporate honesty');
    expect(result.stories[0].summary).toContain('**no measurable impact**');
  });

  it('parses source URLs and names', () => {
    const result = parseNewsletter(sampleMarkdown);
    expect(result.stories[0].sourceUrl).toBe('https://fortune.com/2026/02/17/ai-study');
    expect(result.stories[0].sourceName).toBe('Fortune');
    expect(result.stories[1].sourceUrl).toBe('https://www.anthropic.com/news/claude-sonnet-4-6');
    expect(result.stories[1].sourceName).toBe('Anthropic');
  });

  it('parses image URLs and alt text', () => {
    const result = parseNewsletter(sampleMarkdown);
    expect(result.stories[0].imageUrl).toBe('/images/2026-02-18/story-1.png');
    expect(result.stories[0].altText).toBe('CEOs staring at blank screens');
    expect(result.stories[1].imageUrl).toBe('/images/2026-02-18/story-2.png');
    expect(result.stories[1].altText).toBe('Claude painting');
  });

  it('assigns sequential story numbers', () => {
    const result = parseNewsletter(sampleMarkdown);
    expect(result.stories[0].number).toBe(1);
    expect(result.stories[1].number).toBe(2);
  });

  it('extracts outro (stripping signature lines)', () => {
    const result = parseNewsletter(sampleMarkdown);
    expect(result.outro).toContain('The Closing Peel');
    expect(result.outro).not.toContain('— Spud');
    expect(result.outro).not.toContain('AI-generated editorial');
    expect(result.outro).not.toContain('Delivered by OpenClaw');
  });

  it('handles markdown with no outro', () => {
    const noOutro = `Intro text.

---

### Story One

Body text here.

[Source: Example →](https://example.com)

![Alt text](/images/test/story-1.png)`;

    const result = parseNewsletter(noOutro);
    expect(result.stories).toHaveLength(1);
    expect(result.outro).toBe('');
  });
});

describe('buildStoryBlocks', () => {
  it('produces HTML with numbered headlines', () => {
    const parsed = parseNewsletter(sampleMarkdown);
    const html = buildStoryBlocks(parsed.stories);
    expect(html).toContain('1. Thousands of CEOs Admit AI Has Zero Impact');
    expect(html).toContain('2. Claude Sonnet 4.6 Arrives');
  });

  it('converts relative image URLs to absolute URLs', () => {
    const parsed = parseNewsletter(sampleMarkdown);
    const html = buildStoryBlocks(parsed.stories, 'https://dailyspud.colegottdank.com');
    expect(html).toContain('https://dailyspud.colegottdank.com/images/2026-02-18/story-1.png');
  });

  it('includes source links', () => {
    const parsed = parseNewsletter(sampleMarkdown);
    const html = buildStoryBlocks(parsed.stories);
    expect(html).toContain('href="https://fortune.com/2026/02/17/ai-study"');
    expect(html).toContain('Source: Fortune →');
  });

  it('adds dividers between stories but not after last', () => {
    const parsed = parseNewsletter(sampleMarkdown);
    const html = buildStoryBlocks(parsed.stories);
    // Should have exactly 1 hr divider (between 2 stories)
    const hrCount = (html.match(/<hr/g) || []).length;
    expect(hrCount).toBe(1);
  });

  it('includes img tags with alt text', () => {
    const parsed = parseNewsletter(sampleMarkdown);
    const html = buildStoryBlocks(parsed.stories);
    expect(html).toContain('alt="CEOs staring at blank screens"');
    expect(html).toContain('alt="Claude painting"');
  });
});

describe('buildEmailHtml', () => {
  it('replaces {{DATE}} placeholder', () => {
    const parsed = parseNewsletter(sampleMarkdown);
    const template = '<p>{{DATE}}</p><p>{{INTRO}}</p><!-- STORY BLOCK (repeat for each story) -->\n<!--\nstuff\n--><p>{{OUTRO}}</p>';
    const html = buildEmailHtml(template, {
      date: 'February 18, 2026',
      intro: parsed.intro,
      stories: parsed.stories,
      outro: parsed.outro,
    });
    expect(html).toContain('February 18, 2026');
    expect(html).not.toContain('{{DATE}}');
  });

  it('replaces {{INTRO}} placeholder', () => {
    const parsed = parseNewsletter(sampleMarkdown);
    const template = '<p>{{DATE}}</p><p>{{INTRO}}</p><!-- STORY BLOCK (repeat for each story) -->\n<!--\nstuff\n--><p>{{OUTRO}}</p>';
    const html = buildEmailHtml(template, {
      date: 'February 18, 2026',
      intro: parsed.intro,
      stories: parsed.stories,
      outro: parsed.outro,
    });
    expect(html).toContain(parsed.intro);
    expect(html).not.toContain('{{INTRO}}');
  });

  it('replaces {{OUTRO}} placeholder', () => {
    const parsed = parseNewsletter(sampleMarkdown);
    const template = '<p>{{DATE}}</p><p>{{INTRO}}</p><!-- STORY BLOCK (repeat for each story) -->\n<!--\nstuff\n--><p>{{OUTRO}}</p>';
    const html = buildEmailHtml(template, {
      date: 'February 18, 2026',
      intro: parsed.intro,
      stories: parsed.stories,
      outro: parsed.outro,
    });
    expect(html).toContain('The Closing Peel');
    expect(html).not.toContain('{{OUTRO}}');
  });

  it('replaces story comment block with actual story HTML', () => {
    const parsed = parseNewsletter(sampleMarkdown);
    const template = '<!-- STORY BLOCK (repeat for each story) -->\n<!--\nstuff\n-->';
    const html = buildEmailHtml(template, {
      date: 'February 18, 2026',
      intro: parsed.intro,
      stories: parsed.stories,
      outro: parsed.outro,
    });
    expect(html).toContain('1. Thousands of CEOs');
    expect(html).not.toContain('STORY BLOCK');
  });
});
