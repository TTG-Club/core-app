import type { HomeGreeting } from './types';

import * as z from 'zod';

const homeGreetingSchema: z.ZodType<HomeGreeting> = z.object({
  image: z.string(),
  text: z.string(),
  persona: z.string(),
});

/**
 * Проверяет ответ API с приветствием на главной странице.
 */
export function parseHomeGreeting(payload: unknown): HomeGreeting | null {
  return homeGreetingSchema.nullable().parse(payload);
}
