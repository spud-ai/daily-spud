import { defineCollection, z } from 'astro:content';

const newsletters = defineCollection({
	schema: z.object({
		title: z.string(),
		date: z.date(),
		image: z.string().optional(),
	}),
});

export const collections = { newsletters };
