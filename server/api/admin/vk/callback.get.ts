import {
  completeVkIdLogin,
  getVkVideoEditor,
  VK_VIDEO_LOG,
  VkIdError,
} from '#server/domain/vk-video';
import {
  VK_VIDEO_ADMIN_ROUTE,
  VK_VIDEO_CONNECT_REASON_QUERY,
  VK_VIDEO_CONNECT_RESULT,
  VK_VIDEO_CONNECT_RESULT_QUERY,
} from '#shared/consts';

/**
 * Возврат из VK ID: завершает вход редактора и отправляет его на страницу
 * подключения с итогом в адресе (во всплывающем окне она сообщит итог
 * открывшей странице и закроется). Любая ошибка — тоже возврат на
 * страницу, а не голый JSON.
 */
export default defineEventHandler(async (event) => {
  const target = new URLSearchParams();

  try {
    await completeVkIdLogin(event, await getVkVideoEditor(event));

    target.set(
      VK_VIDEO_CONNECT_RESULT_QUERY,
      VK_VIDEO_CONNECT_RESULT.connected,
    );
  } catch (error) {
    consola.warn(VK_VIDEO_LOG, 'Вход через VK ID не завершён:', error);

    target.set(VK_VIDEO_CONNECT_RESULT_QUERY, VK_VIDEO_CONNECT_RESULT.error);

    target.set(
      VK_VIDEO_CONNECT_REASON_QUERY,
      error instanceof VkIdError ? error.message : 'unknown',
    );
  }

  return sendRedirect(event, `${VK_VIDEO_ADMIN_ROUTE}?${target}`, 302);
});
