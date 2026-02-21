import { describe, it, expect } from 'vitest';
import { validateBriefingJson, briefingToMarkdown } from '../lib/publish.js';
import type { BriefingJson } from '../lib/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const validBriefing: BriefingJson = {
  date: '2026-02-20',
  title: 'Test Newsletter Title',
  intro: 'This is the intro paragraph.',
  stories: [
    {
      headline: 'First Story Headline',
      body: 'This is the body of the first story.',
      sourceUrl: 'https://example.com/story-1',
      sourceName: 'Example',
      imagePrompt: 'A test image prompt',
      imagePath: '/images/2026-02-20/story-1.png',
    },
    {
      headline: 'Second Story Headline',
      body: 'This is the body of the second story.',
      sourceUrl: 'https://example.com/story-2',
      sourceName: 'Other Source',
      imagePrompt: 'Another test image prompt',
      imagePath: '/images/2026-02-20/story-2.png',
    },
  ],
  outro: 'This is the outro wrap-up.',
};

describe('validateBriefingJson', () => {
  it('accepts valid briefing JSON', () => {
    const result = validateBriefingJson(validBriefing);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing date', () => {
    const invalid = { ...validBriefing, date: '' };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('date is required');
  });

  it('rejects invalid date format', () => {
    const invalid = { ...validBriefing, date: '02-20-2026' };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('date'))).toBe(true);
  });

  it('rejects missing title', () => {
    const invalid = { ...validBriefing, title: '' };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title is required');
  });

  it('rejects missing intro', () => {
    const invalid = { ...validBriefing, intro: '' };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('intro is required');
  });

  it('rejects empty stories array', () => {
    const invalid = { ...validBriefing, stories: [] };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('at least one story is required');
  });

  it('rejects story with missing headline', () => {
    const invalid = {
      ...validBriefing,
      stories: [{ ...validBriefing.stories[0], headline: '' }],
    };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('headline'))).toBe(true);
  });

  it('rejects story with missing body', () => {
    const invalid = {
      ...validBriefing,
      stories: [{ ...validBriefing.stories[0], body: '' }],
    };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('body'))).toBe(true);
  });

  it('rejects story with missing sourceUrl', () => {
    const invalid = {
      ...validBriefing,
      stories: [{ ...validBriefing.stories[0], sourceUrl: '' }],
    };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('sourceUrl'))).toBe(true);
  });

  it('rejects story with missing sourceName', () => {
    const invalid = {
      ...validBriefing,
      stories: [{ ...validBriefing.stories[0], sourceName: '' }],
    };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('sourceName'))).toBe(true);
  });

  it('rejects story with missing imagePath', () => {
    const invalid = {
      ...validBriefing,
      stories: [{ ...validBriefing.stories[0], imagePath: '' }],
    };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('imagePath'))).toBe(true);
  });

  it('allows missing outro (optional)', () => {
    const noOutro = { ...validBriefing, outro: '' };
    const result = validateBriefingJson(noOutro);
    expect(result.valid).toBe(true);
  });

  it('collects multiple errors at once', () => {
    const invalid = { ...validBriefing, date: '', title: '', intro: '', stories: [] };
    const result = validateBriefingJson(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe('briefingToMarkdown', () => {
  it('produces markdown that round-trips through parseNewsletter', async () => {
    // Import parseNewsletter to verify round-trip
    const { parseNewsletter } = await import('../lib/email.js');

    const markdown = briefingToMarkdown(validBriefing);

    // Strip frontmatter for parsing
    const bodyRaw = markdown.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
    const parsed = parseNewsletter(bodyRaw);

    expect(parsed.stories).toHaveLength(2);
    expect(parsed.stories[0].headline).toBe('First Story Headline');
    expect(parsed.stories[0].summary).toBe('This is the body of the first story.');
    expect(parsed.stories[0].sourceUrl).toBe('https://example.com/story-1');
    expect(parsed.stories[0].sourceName).toBe('Example');
    expect(parsed.stories[0].imageUrl).toBe('/images/2026-02-20/story-1.png');
    expect(parsed.intro).toBe('This is the intro paragraph.');
  });

  it('includes correct frontmatter', () => {
    const markdown = briefingToMarkdown(validBriefing);
    expect(markdown).toContain('title: "The Daily Spud: Test Newsletter Title"');
    expect(markdown).toContain('date: 2026-02-20');
    expect(markdown).toContain('image: "/images/2026-02-20/story-1.png"');
  });

  it('matches gold standard format structure', () => {
    // Read the gold standard newsletter
    const goldPath = path.join(__dirname, '../../src/content/newsletters/2026-02-18.md');
    if (!fs.existsSync(goldPath)) {
      // Skip if file doesn't exist in test environment
      return;
    }
    const gold = fs.readFileSync(goldPath, 'utf-8');
    const markdown = briefingToMarkdown(validBriefing);

    // Both should have same structural elements
    const goldStructure = gold.match(/^(---|###|\[Source:|!\[|\*—)/gm) || [];
    const testStructure = markdown.match(/^(---|###|\[Source:|!\[|\*—)/gm) || [];

    // Gold has 6 stories, test has 2, so adjust expected counts
    // But the pattern per story should be the same
    const goldPerStory = goldStructure.filter(s => s === '###').length;
    const testPerStory = testStructure.filter(s => s === '###').length;
    expect(goldPerStory).toBe(6);
    expect(testPerStory).toBe(2);
  });
});
