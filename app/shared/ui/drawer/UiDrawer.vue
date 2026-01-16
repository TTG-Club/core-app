<script setup lang="ts">
  import { DrawerActions, DrawerBody, DrawerHeader } from './ui';

  import type { Dayjs } from 'dayjs';

  import type { SourceResponse } from '~/shared/types';

  import type { DrawerTitleName } from './ui';

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
    direction="right"
    handle-only
    fixed
    :ui="{ container: 'select-text **:select-text' }"
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
      >
        <slot name="default" />
      </DrawerBody>
    </template>
  </UDrawer>
</template>
