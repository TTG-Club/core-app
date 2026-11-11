<script setup lang="ts">
  import { getVkVideoId } from '~ui/video';

  import { useVkVideoConnection, useVkVideoCover } from '../composables';
  import {
    getVkVideoKey,
    VK_VIDEO_ADMIN_TEXT,
    VK_VIDEO_COVER_TEXT,
    VK_VIDEO_ICONS,
  } from '../model';

  /**
   * Обложка записи из кадра ролика ВК — через ВК того, кто правит запись.
   * Ролик вставили или сменили, а своей обложки нет — кадр подставляется сам.
   * Не ВК — блок не показывается.
   */
  const {
    videoUrl,
    savedVideoUrl,
    section,
    maxSize = undefined,
  } = defineProps<{
    /** Ссылка на ролик из формы. */
    videoUrl: string | null;
    /**
     * Сохранённая ссылка записи: кадр подставляется сам, только когда ролик
     * сменили, — открытие записи не меняет форму.
     */
    savedVideoUrl: string | null;
    /** Раздел загрузок обложки (как у `UploadImage`). */
    section: string;
    /** Предел размера обложки (как у `UploadImage`). */
    maxSize?: string | number;
  }>();

  const cover = defineModel<string | undefined>('cover');
  const uploading = defineModel<boolean>('uploading', { default: false });

  const { isConnected, isConnecting, status, connect } = useVkVideoConnection();

  const { isLoading, takeCover } = useVkVideoCover({ section, maxSize });

  const video = computed(() => getVkVideoId(videoUrl));

  const isStatusLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const isVideoChanged = computed(
    () =>
      !!video.value
      && getVkVideoKey(video.value)
        !== getVkVideoKey(getVkVideoId(savedVideoUrl)),
  );

  const takeLabel = computed(() =>
    cover.value ? VK_VIDEO_COVER_TEXT.retake : VK_VIDEO_COVER_TEXT.take,
  );

  const isConnectBusy = computed(() => isConnecting.value || isLoading.value);

  /** Берёт кадр ролика обложкой записи. */
  async function applyCover(): Promise<void> {
    if (!video.value) {
      return;
    }

    uploading.value = true;

    try {
      const url = await takeCover(video.value);

      if (url) {
        cover.value = url;
      }
    } finally {
      uploading.value = false;
    }
  }

  /** Подключает ВК и, если своей обложки нет, сразу берёт кадр. */
  async function handleConnect(): Promise<void> {
    const isDone = await connect();

    if (isDone && !cover.value) {
      await applyCover();
    }
  }

  // Новый ролик ВК без своей обложки — кадр подставляется сам. Цикла нет:
  // applyCover меняет только обложку, а она в источники не входит.
  watch([() => getVkVideoKey(video.value), isConnected], async () => {
    if (isConnected.value && isVideoChanged.value && !cover.value) {
      await applyCover();
    }
  });
</script>

<template>
  <div
    v-if="video"
    class="flex flex-col gap-2 rounded-lg border border-default p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
  >
    <USkeleton
      v-if="isStatusLoading"
      class="h-8 w-full"
    />

    <template v-else-if="isConnected">
      <p class="text-muted">
        {{ VK_VIDEO_COVER_TEXT.connectedHint }}
      </p>

      <UButton
        :icon="VK_VIDEO_ICONS.cover"
        color="neutral"
        variant="soft"
        size="sm"
        class="shrink-0"
        :label="takeLabel"
        :loading="isLoading"
        @click.left.exact.prevent="applyCover"
      />
    </template>

    <template v-else>
      <p class="text-muted">
        {{ VK_VIDEO_COVER_TEXT.connectHint }}
      </p>

      <UButton
        :icon="VK_VIDEO_ICONS.connect"
        size="sm"
        class="shrink-0"
        :label="VK_VIDEO_ADMIN_TEXT.connect"
        :loading="isConnectBusy"
        @click.left.exact.prevent="handleConnect"
      />
    </template>
  </div>
</template>
