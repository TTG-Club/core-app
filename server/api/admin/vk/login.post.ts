import type { VkVideoLoginStart } from '#shared/types';

import { getVkVideoEditor, startVkIdLogin } from '#server/domain/vk-video';

/**
 * Начинает вход через VK ID для текущего редактора. POST через `$fetch`, а
 * не переход по ссылке: так запрос проходит обычное продление токена сайта.
 * Страница открывает возвращённый адрес ВК во всплывающем окне.
 */
export default defineEventHandler(async (event): Promise<VkVideoLoginStart> => {
  await getVkVideoEditor(event);

  return { authorizeUrl: startVkIdLogin(event) };
});
