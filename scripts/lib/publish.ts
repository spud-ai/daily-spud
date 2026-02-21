import type { BriefingJson } from './types.js';
import { templateMarkdown } from './template.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateBriefingJson(json: BriefingJson): ValidationResult {
  const errors: string[] = [];

  if (!json.date) {
    errors.push('date is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(json.date)) {
    errors.push('date must be in YYYY-MM-DD format');
  }

  if (!json.title) errors.push('title is required');
  if (!json.intro) errors.push('intro is required');

  if (!json.stories || json.stories.length === 0) {
    errors.push('at least one story is required');
  } else {
    for (let i = 0; i < json.stories.length; i++) {
      const story = json.stories[i];
      const prefix = `stories[${i}]`;
      if (!story.headline) errors.push(`${prefix}.headline is required`);
      if (!story.body) errors.push(`${prefix}.body is required`);
      if (!story.sourceUrl) errors.push(`${prefix}.sourceUrl is required`);
      if (!story.sourceName) errors.push(`${prefix}.sourceName is required`);
      if (!story.imagePath) errors.push(`${prefix}.imagePath is required`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function briefingToMarkdown(json: BriefingJson): string {
  return templateMarkdown(json);
}
