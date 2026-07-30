import type { ItemLinkResponse } from './link';

import { z } from 'zod';

/**
 * Схема ссылки на предмет из поиска раздела. `looseObject` сохраняет поля,
 * которые схема не описывает, а `catch` гасит битые значения: из-за одной
 * некорректной подписи предмет не должен исчезать из списка.
 *
 * Категория и типы приходят не у всех предметов, поэтому они необязательные:
 * предмет без них попадёт в группу «Прочее», а не сломает построение групп.
 */
const itemLinkSchema = z.looseObject({
  url: z.string(),
  name: z
    .object({
      rus: z.string().catch(''),
      eng: z.string().catch(''),
    })
    .catch({ rus: '', eng: '' }),
  source: z
    .object({
      name: z
        .object({
          rus: z.string().catch(''),
          eng: z.string().catch(''),
          label: z.string().catch(''),
        })
        .catch({ rus: '', eng: '', label: '' }),
      group: z
        .object({
          rus: z.string().catch(''),
          label: z.string().catch(''),
        })
        .catch({ rus: '', label: '' }),
      page: z.number().catch(0),
    })
    .catch({
      name: { rus: '', eng: '', label: '' },
      group: { rus: '', label: '' },
      page: 0,
    }),
  cost: z.string().catch(''),
  category: z.string().optional().catch(undefined),
  types: z.array(z.string()).optional().catch(undefined),
});

/**
 * Валидирует ответ `GET /api/v2/item/search`. Предмет без `url` опознать
 * нечем, поэтому он отбрасывается, а не подставляется пустой строкой.
 *
 * @param input сырой ответ поиска предметов.
 * @returns предметы раздела в порядке, полученном от API.
 */
export function parseItemLinks(input: unknown): Array<ItemLinkResponse> {
  const rawItems = z.array(z.unknown()).catch([]).parse(input);

  return rawItems.flatMap((rawItem) => {
    const parsedItem = itemLinkSchema.safeParse(rawItem);

    return parsedItem.success ? [parsedItem.data] : [];
  });
}
