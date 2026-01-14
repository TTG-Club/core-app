<script setup lang="ts">
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
  const { copy } = useCopyAndShare();
  const navbarHidden = useState('navbar-hidden');

  const formattedDateTime = computed(() => {
    const converted = dayjs(dateTime);

    if (!dateTime || !converted.isValid()) {
      return undefined;
    }

    return converted.local().format(dateTimeFormat);
  });
</script>

<template>
  <div class="flex w-full flex-col">
    <div class="w-full shrink-0">
      <div
        class="mx-auto flex w-full max-w-(--max-content) flex-col gap-1 p-4 md:pt-6"
      >
        <div class="flex items-center gap-1">
          <h2
            v-if="title"
            class="truncate text-2xl text-(--ui-text-highlighted)"
            :class="{ 'cursor-pointer': copyText }"
            @click.left.exact.prevent="copy(title)"
          >
            {{ title }}
          </h2>

          <USkeleton
            v-else
            class="h-8 w-1/4"
          />

          <div
            v-if="$slots.actions"
            :class="[
              'fixed z-1 ml-auto flex shrink-0 gap-1 md:static',
              'right-2 bottom-(--navbar-height) max-md:mb-2',
              'transition-[bottom] duration-200 ease-in-out',
              'max-md:rounded-md max-md:border max-md:border-default',
              'max-md:bg-default/50 max-md:p-1 max-md:shadow-md max-md:backdrop-blur-lg',
              navbarHidden ? 'bottom-0' : undefined,
            ]"
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
            @click.left.exact.prevent="copy(subtitle)"
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
              show-tooltip
              show-group
            />
          </div>
        </div>
      </div>
    </div>

    <div class="w-full shrink-0">
      <div
        class="mx-auto flex w-full max-w-(--max-content) flex-col gap-2 px-4 pb-8 lg:gap-3"
      >
        <slot name="default" />
      </div>
    </div>
  </div>
</template>
