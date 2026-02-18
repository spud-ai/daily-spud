import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('newsletters'))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'The Daily Spud',
    description: 'AI news & absurdist cartoons, delivered daily by an agent.',
    site: 'https://dailyspud.colegottdank.com',
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      link: `/issue/${post.id.replace('.md', '')}`,
    })),
    customData: '<language>en-us</language>',
  });
}
