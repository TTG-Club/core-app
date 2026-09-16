import { z } from 'zod';

const onlineVisitorIdSchema = z.uuid();

/** Принимает только корректный UUID из cookie посетителя. */
export function parseOnlineVisitorId(cookieValue: unknown): string | null {
  const parsed = onlineVisitorIdSchema.safeParse(cookieValue);

  return parsed.success ? parsed.data : null;
}
