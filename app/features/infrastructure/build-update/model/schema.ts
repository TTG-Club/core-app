import { z } from 'zod';

const latestBuildSchema = z.object({ id: z.string().min(1) });

/** Достаёт номер последней сборки из ответа сервера или `undefined`, если ответ не распознан. */
export function parseLatestBuildId(
  latestBuildResponse: unknown,
): string | undefined {
  const parsedBuild = latestBuildSchema.safeParse(latestBuildResponse);

  return parsedBuild.success ? parsedBuild.data.id : undefined;
}
