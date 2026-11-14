<script setup lang="ts">
  import type { VkVideoLoginMessage } from '~admin/vk-video/model';

  import {
    VK_VIDEO_CONNECT_REASON_QUERY,
    VK_VIDEO_CONNECT_RESULT,
    VK_VIDEO_CONNECT_RESULT_QUERY,
  } from '#shared/consts';
  import { Role } from '~/shared/types';
  import {
    VK_VIDEO_ADMIN_PAGE_HINT,
    VK_VIDEO_ADMIN_PAGE_TITLE,
    VK_VIDEO_ADMIN_SEO_TITLE,
    VK_VIDEO_ADMIN_TEXT,
    VK_VIDEO_LOGIN_MESSAGE_TYPE,
    VK_VIDEO_LOGIN_WINDOW_NAME,
  } from '~admin/vk-video/model';
  import { VkVideoConnectionCard } from '~admin/vk-video/ui';

  // Свой ВК подключает каждый, кто правит записи с роликами: мета дочерней
  // страницы перекрывает роли родителя (admin.vue).
  definePageMeta({
    auth: { roles: [Role.ADMIN, Role.MODERATOR] },
  });

  useSeoMeta({
    title: VK_VIDEO_ADMIN_SEO_TITLE,
  });

  const route = useRoute();
  const router = useRouter();
  const $toast = useToast();

  // Сервер возвращает сюда после входа через VK ID с итогом в адресе. Во
  // всплывающем окне входа страница передаёт итог открывшей её странице и
  // закрывается, иначе показывает итог сама и убирает его из адреса.
  onMounted(() => {
    const result = route.query[VK_VIDEO_CONNECT_RESULT_QUERY];

    if (typeof result !== 'string' || !result) {
      return;
    }

    const isConnected = result === VK_VIDEO_CONNECT_RESULT.connected;
    const reasonQuery = route.query[VK_VIDEO_CONNECT_REASON_QUERY];

    const reason =
      typeof reasonQuery === 'string' && reasonQuery ? reasonQuery : null;

    if (window.opener && window.name === VK_VIDEO_LOGIN_WINDOW_NAME) {
      const message: VkVideoLoginMessage = {
        type: VK_VIDEO_LOGIN_MESSAGE_TYPE,
        result: isConnected
          ? VK_VIDEO_CONNECT_RESULT.connected
          : VK_VIDEO_CONNECT_RESULT.error,
        reason,
      };

      window.opener.postMessage(message, window.location.origin);
      window.close();

      return;
    }

    $toast.add(
      isConnected
        ? { color: 'success', title: VK_VIDEO_ADMIN_TEXT.connectSuccess }
        : {
            color: 'error',
            title: VK_VIDEO_ADMIN_TEXT.connectError,
            description: reason ?? undefined,
          },
    );

    router.replace({ query: {} });
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="VK_VIDEO_ADMIN_PAGE_TITLE"
  >
    <div class="space-y-6">
      <p class="text-sm text-muted">
        {{ VK_VIDEO_ADMIN_PAGE_HINT }}
      </p>

      <VkVideoConnectionCard />
    </div>
  </NuxtLayout>
</template>
