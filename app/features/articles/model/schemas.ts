import { z } from 'zod';

/** Схема ответа `/api/v2/articles/tags`: список тегов опубликованных записей. */
export const articleTagsSchema = z.array(z.string());
