export interface Story {
  headline: string;
  body: string;
  sourceUrl: string;
  sourceName: string;
  imagePrompt: string;
  imagePath: string;
}

export interface BriefingJson {
  date: string;
  title: string;
  intro: string;
  stories: Story[];
  outro: string;
}

export interface ParsedStory {
  number: number;
  headline: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl: string;
  altText: string;
}

export interface ParsedNewsletter {
  intro: string;
  stories: ParsedStory[];
  outro: string;
}
