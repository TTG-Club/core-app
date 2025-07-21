<script setup lang="ts">
  import { useCopy, useDayjs } from '~/shared/composables';
  import { SourceTag } from '~ui/source-tag';

  import type { Dayjs } from 'dayjs';
  import type { SourceResponse } from '~/shared/types';

  const {
    copyText = false,
    subtitle = undefined,
    source = undefined,
    dateTime = undefined,
    dateTimeFormat = 'LLL',
  } = defineProps<{
    title: string | undefined;
    copyText?: boolean;
    subtitle?: string;
    dateTime?: string | number | Date | Dayjs | null;
    dateTimeFormat?: string;
    source?: SourceResponse;
  }>();

  const dayjs = useDayjs();
  const { copy } = useCopy();

  const formattedDateTime = computed(() => {
    const converted = dayjs(dateTime);

    if (!dateTime || !converted.isValid()) {
      return undefined;
    }

    return converted.local().format(dateTimeFormat);
  });

  function handleCopy(text: string) {
    if (!copyText) {
      return;
    }

    copy(text);
  }
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <div class="flex items-center gap-1">
      <h2
        v-if="title"
        class="truncate text-lg text-(--color-text-title)"
        :class="{ 'cursor-pointer': copyText }"
        @click.left.exact.prevent="handleCopy(title)"
      >
        {{ title }}
      </h2>

      <USkeleton
        v-else
        class="h-6 w-1/2"
      />

      <div
        v-if="$slots.actions"
        class="ml-auto flex shrink-0 gap-1"
      >
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="subtitle || formattedDateTime || source"
      class="flex items-center gap-1"
    >
      <span
        v-if="subtitle"
        class="truncate text-sm text-secondary"
        :class="{ 'cursor-pointer': copyText }"
        @click.left.exact.prevent="handleCopy(subtitle)"
      >
        {{ subtitle }}
      </span>

      <div class="ml-auto flex shrink-0 gap-1">
        <span
          v-if="formattedDateTime"
          class="hidden text-sm text-secondary md:block"
        >
          {{ formattedDateTime }}
        </span>

        <SourceTag
          v-if="source"
          :source="source"
        />
      </div>
    </div>
  </div>
</template>
