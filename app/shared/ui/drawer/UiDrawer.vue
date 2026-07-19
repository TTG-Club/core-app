<script setup lang="ts">
  import type { Dayjs } from 'dayjs';

  import type { SourceResponse } from '~/shared/types';

  import type { DrawerTitleName } from './ui';

  import { DrawerActions, DrawerBody, DrawerHeader } from './ui';

  const {
    title,
    notDetail = false,
    copyTitle = false,
    source = undefined,
    url = undefined,
    editUrl = undefined,
    dateTime = undefined,
    dateTimeFormat = undefined,
    dismissible = undefined,
    class: _class = 'w-2xl',
  } = defineProps<{
    title: DrawerTitleName;
    source?: SourceResponse;
    isLoading?: boolean;
    isError?: boolean;
    url?: string;
    editUrl?: string;
    copyTitle?: boolean;
    dateTime?: string | number | Date | Dayjs | null;
    dateTimeFormat?: string;
    notDetail?: boolean;
    dismissible?: boolean;
    class?: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  // Публикуем путь открытой сущности для баг-репорта (стандартный режим).
  const { openEntityPath, setOpenEntityPath, clearOpenEntityPath } =
    useOpenEntityPath();

  // Путь, записанный именно этим экземпляром drawer-а, — для guard «чистим только своё».
  let lastSetPath = '';

  /** Извлекает относительный путь из абсолютного url для копирования. */
  function extractRelativePath(absoluteUrl: string): string {
    try {
      return new URL(absoluteUrl).pathname;
    } catch {
      return absoluteUrl;
    }
  }

  watch(
    () => url,
    (newUrl) => {
      // Drawer без url (подклассы, мультикласс, превью) не трогает канал,
      // чтобы не затереть путь родительского drawer-а.
      if (!newUrl) {
        return;
      }

      lastSetPath = extractRelativePath(newUrl);
      setOpenEntityPath(lastSetPath);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    // Чистим только если в канале всё ещё наш путь: защита от вложенных
    // drawer-ов и гонки close/open при быстром переключении.
    if (lastSetPath && openEntityPath.value === lastSetPath) {
      clearOpenEntityPath();
    }
  });

  const isGalleryOpened = useState('ui-gallery-opened', () => false);
  const { greaterOrEqual } = useBreakpoints();

  const isTabletOrGreater = greaterOrEqual(Breakpoint.MD);

  const isDismissible = computed(() => {
    if (dismissible !== undefined) {
      return dismissible;
    }

    return !isGalleryOpened.value;
  });

  const computedTitle = computed(() =>
    typeof title === 'string' ? title : title?.rus,
  );

  const computedSubtitle = computed(() =>
    typeof title === 'string' ? undefined : title?.eng,
  );

  /**
   * Путь для блока комментариев под телом сущности: только у контентных
   * дроверов с каноническим адресом (служебные — мультикласс, подклассы,
   * превью мастерской — без url или с notDetail).
   */
  const commentsPath = computed(() => (notDetail ? undefined : url));

  const classList = computed(() => {
    if (!_class) {
      return 'w-2xl';
    }

    if (!_class.includes(' w-') && !_class.startsWith('w-')) {
      return `${notDetail ? 'w-xl' : 'w-2xl'} ${_class}`;
    }

    return _class;
  });
</script>

<template>
  <UDrawer
    :handle="!notDetail"
    :class="classList"
    :dismissible="isDismissible"
    :inset="isTabletOrGreater"
    :title="computedTitle || ''"
    :description="''"
    direction="right"
    handle-only
    fixed
    :ui="{
      container: 'select-text **:select-text',
      title: 'sr-only',
      description: 'sr-only',
    }"
    @close="$emit('close')"
  >
    <template #header>
      <DrawerHeader
        :title="computedTitle"
        :subtitle="computedSubtitle"
        :source="source"
        :date-time="dateTime"
        :date-time-format="dateTimeFormat"
        :copy-text="copyTitle"
      >
        <template #actions>
          <slot name="actions" />

          <DrawerActions
            :edit-url="editUrl"
            :url
            @close="$emit('close')"
          />
        </template>
      </DrawerHeader>
    </template>

    <template #body>
      <DrawerBody
        :is-loading="isLoading"
        :is-error="isError"
        :comments-path="commentsPath"
      >
        <slot name="default" />
      </DrawerBody>
    </template>
  </UDrawer>
</template>
