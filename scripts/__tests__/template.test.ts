import { describe, it, expect } from 'vitest';
import { templateMarkdown } from '../lib/template.js';
import type { BriefingJson } from '../lib/types.js';

const sampleBriefing: BriefingJson = {
  date: '2026-02-18',
  title: 'CEOs Admit AI Is Useless, Toilets Become Tech Stocks',
  intro: 'Today\'s AI news reads like a therapy session for tech executives: thousands of CEOs finally admitted that their expensive AI investments have accomplished absolutely nothing. Meanwhile, a Japanese toilet manufacturer became the hottest AI stock on the market, Meta went on a GPU shopping spree that would make a crypto miner blush, and the EU put Grok in handcuffs. Let\'s dig in.',
  stories: [
    {
      headline: 'Thousands of CEOs Admit AI Has Zero Impact on Productivity',
      body: 'In a stunning display of corporate honesty that has left consultants worldwide reaching for their smelling salts, a major study has revealed that thousands of CEOs now admit AI has had **no measurable impact** on employment or productivity at their companies. The research, which surveyed business leaders who\'ve collectively spent billions on AI implementations, found that the much-hyped productivity revolution is about as real as the ROI from your company\'s "synergy workshop." It\'s the classic Solow paradox updated for the LLM age: we see the AI everywhere except in the productivity statistics.',
      sourceUrl: 'https://fortune.com/2026/02/17/ai-productivity-paradox-ceo-study-robert-solow-information-technology-age/',
      sourceName: 'Fortune',
      imagePrompt: 'CEOs staring at blank productivity charts',
      imagePath: '/images/2026-02-18/story-1.png',
    },
    {
      headline: 'Claude Sonnet 4.6 Arrives With a French Accent',
      body: 'Anthropic quietly dropped Claude Sonnet 4.6, and the Hacker News crowd responded with 1,242 upvotes and over a thousand comments\u2014statistically significant enthusiasm for a mid-tier model update. The new Sonnet promises faster reasoning and improved coding capabilities, essentially positioning itself as the thinking person\'s GPT-4o mini. While everyone was distracted by the OpenAI drama this week, Anthropic appears to be executing a classic "stealth excellence" strategy: ship good models, don\'t start cults, repeat.',
      sourceUrl: 'https://www.anthropic.com/news/claude-sonnet-4-6',
      sourceName: 'Anthropic',
      imagePrompt: 'Claude painting a masterpiece',
      imagePath: '/images/2026-02-18/story-2.png',
    },
  ],
  outro: '**The Closing Peel:** Between CEOs admitting AI is useless, toilet stocks mooning on AI hype, and Grok getting arrested by the EU, today\'s news perfectly captures the absurdity of the moment.',
};

describe('templateMarkdown', () => {
  it('produces valid frontmatter with title, date, and image', () => {
    const result = templateMarkdown(sampleBriefing);
    const lines = result.split('\n');

    expect(lines[0]).toBe('---');
    expect(lines[1]).toBe('title: "The Daily Spud: CEOs Admit AI Is Useless, Toilets Become Tech Stocks"');
    expect(lines[2]).toBe('date: 2026-02-18');
    expect(lines[3]).toBe('image: "/images/2026-02-18/story-1.png"');
    expect(lines[4]).toBe('---');
  });

  it('includes intro paragraph after frontmatter', () => {
    const result = templateMarkdown(sampleBriefing);
    const lines = result.split('\n');

    // Line 5 is empty, line 6 is the intro
    expect(lines[5]).toBe('');
    expect(lines[6]).toBe(sampleBriefing.intro);
  });

  it('separates intro from first story with ---', () => {
    const result = templateMarkdown(sampleBriefing);
    const lines = result.split('\n');

    // After intro: empty line, ---, empty line, then ### headline
    expect(lines[7]).toBe('');
    expect(lines[8]).toBe('---');
    expect(lines[9]).toBe('');
    expect(lines[10]).toMatch(/^### /);
  });

  it('formats each story with headline, body, source, and image', () => {
    const result = templateMarkdown(sampleBriefing);

    // First story
    expect(result).toContain('### Thousands of CEOs Admit AI Has Zero Impact on Productivity');
    expect(result).toContain(sampleBriefing.stories[0].body);
    expect(result).toContain('[Source: Fortune →](https://fortune.com/2026/02/17/ai-productivity-paradox-ceo-study-robert-solow-information-technology-age/)');
    expect(result).toContain('![Thousands of CEOs Admit AI Has Zero Impact on Productivity](/images/2026-02-18/story-1.png)');

    // Second story
    expect(result).toContain('### Claude Sonnet 4.6 Arrives With a French Accent');
    expect(result).toContain('[Source: Anthropic →](https://www.anthropic.com/news/claude-sonnet-4-6)');
    expect(result).toContain('![Claude Sonnet 4.6 Arrives With a French Accent](/images/2026-02-18/story-2.png)');
  });

  it('separates stories with --- dividers', () => {
    const result = templateMarkdown(sampleBriefing);
    // Between stories there should be: empty line, ---, empty line
    const storyDividerPattern = /!\[.*?\]\(.*?\)\n\n---\n\n###/;
    expect(result).toMatch(storyDividerPattern);
  });

  it('includes outro section after last story', () => {
    const result = templateMarkdown(sampleBriefing);
    // After last image: empty, ---, empty, outro, empty, signature
    expect(result).toContain(sampleBriefing.outro);
  });

  it('ends with signature lines', () => {
    const result = templateMarkdown(sampleBriefing);
    expect(result).toContain('*\u2014 Spud \u{1F954}*');
    expect(result).toContain('*AI-generated editorial cartoons by Gemini \u00D7 The Spud Style*');
    expect(result).toContain('*Delivered by OpenClaw*');
  });

  it('ends with a trailing newline', () => {
    const result = templateMarkdown(sampleBriefing);
    expect(result.endsWith('\n')).toBe(true);
    // But not double newline
    expect(result.endsWith('\n\n')).toBe(false);
  });

  it('uses first story image as frontmatter image', () => {
    const result = templateMarkdown(sampleBriefing);
    expect(result).toContain('image: "/images/2026-02-18/story-1.png"');
  });

  it('handles special characters in title', () => {
    const briefing: BriefingJson = {
      ...sampleBriefing,
      title: 'AI\'s "Big" Problem: 100% Hype & $0 Returns',
    };
    const result = templateMarkdown(briefing);
    // Title with quotes should be properly escaped or handled
    expect(result).toContain('title: "The Daily Spud: AI\'s \\"Big\\" Problem: 100% Hype & $0 Returns"');
  });

  it('handles empty outro gracefully', () => {
    const briefing: BriefingJson = {
      ...sampleBriefing,
      outro: '',
    };
    const result = templateMarkdown(briefing);
    // Should still have signature but no outro paragraph
    expect(result).toContain('*\u2014 Spud \u{1F954}*');
    // Should not have double blank lines where outro would be
    expect(result).not.toContain('\n\n\n\n');
  });

  it('produces exact format for a complete newsletter', () => {
    const result = templateMarkdown(sampleBriefing);

    // Verify the overall structure by checking section ordering
    const introIdx = result.indexOf(sampleBriefing.intro);
    const story1Idx = result.indexOf('### Thousands of CEOs');
    const story2Idx = result.indexOf('### Claude Sonnet 4.6');
    const outroIdx = result.indexOf(sampleBriefing.outro);
    const sigIdx = result.indexOf('*\u2014 Spud');

    expect(introIdx).toBeGreaterThan(0);
    expect(story1Idx).toBeGreaterThan(introIdx);
    expect(story2Idx).toBeGreaterThan(story1Idx);
    expect(outroIdx).toBeGreaterThan(story2Idx);
    expect(sigIdx).toBeGreaterThan(outroIdx);
  });

  it('works with a single story', () => {
    const briefing: BriefingJson = {
      ...sampleBriefing,
      stories: [sampleBriefing.stories[0]],
    };
    const result = templateMarkdown(briefing);
    expect(result).toContain('### Thousands of CEOs');
    expect(result).not.toContain('### Claude Sonnet');
    expect(result).toContain(sampleBriefing.outro);
  });
});
