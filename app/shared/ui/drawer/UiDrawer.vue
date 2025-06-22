<script setup lang="ts">
  import {
    DrawerHeader,
    DrawerActions,
    DrawerBody,
    type DrawerTitleName,
  } from './ui';

  import { Breakpoint, useBreakpoints } from '~/shared/composables';

  import type { Dayjs } from 'dayjs';
  import type { SourceResponse } from '~/shared/types';

  const {
    title,
    copyTitle = false,
    source = undefined,
    url = undefined,
    editUrl = undefined,
    dateTime = undefined,
    dateTimeFormat = undefined,
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
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { greaterOrEqual } = useBreakpoints();

  const isTabletOrGreater = greaterOrEqual(Breakpoint.MD);

  const computedTitle = computed(() =>
    typeof title === 'string' ? title : title?.rus,
  );

  const computedSubtitle = computed(() =>
    typeof title === 'string' ? undefined : title?.eng,
  );
</script>

<template>
  <UDrawer
    :handle="isTabletOrGreater && !notDetail"
    :inset="isTabletOrGreater"
    direction="right"
    :class="notDetail ? 'w-xl' : 'w-2xl'"
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
