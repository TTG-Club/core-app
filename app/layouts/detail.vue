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
  const navbarHidden = useState('navbar-hidden');

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
  <div class="flex w-full flex-col">
    <div class="w-full shrink-0">
      <div
        class="mx-auto flex w-full max-w-(--max-content) flex-col gap-2 p-4 md:pt-8 lg:gap-3"
      >
        <div class="flex items-center gap-1">
          <h2
            v-if="title"
            class="truncate text-2xl text-(--color-text-title)"
            :class="{ 'cursor-pointer': copyText }"
            @click="handleCopy(title)"
          >
            {{ title }}
          </h2>

          <USkeleton
            v-else
            class="h-8 w-1/4"
          />

          <div
            v-if="$slots.actions"
            class="actions flex"
            :class="{ 'navbar-hidden': navbarHidden }"
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
            class="truncate text-secondary"
            :class="{ 'cursor-pointer': copyText }"
            @click="handleCopy(subtitle)"
          >
            {{ subtitle }}
          </span>

          <div class="ml-auto flex shrink-0 gap-1">
            <span
              v-if="formattedDateTime"
              class="hidden text-secondary md:block"
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
    </div>

    <div class="w-full shrink-0">
      <div
        class="mx-auto flex w-full max-w-(--max-content) flex-col gap-2 px-4 lg:gap-3"
      >
        <slot name="default" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference '~tw';

  .actions {
    @apply fixed ml-auto flex shrink-0 gap-1 md:static;
    @apply right-2 bottom-(--navbar-height) max-md:mb-2;
    @apply transition-[bottom] duration-200 ease-in-out;
    @apply max-md:rounded-md max-md:border max-md:border-(--color-border);
    @apply max-md:p-1 max-md:shadow-md max-md:backdrop-blur-lg;

    &.navbar-hidden {
      @apply bottom-0;
    }
  }
</style>
