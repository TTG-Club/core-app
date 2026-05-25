<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  import type { SourceResponse } from '~/shared/types';

  import { SourceTag } from '~ui/source-tag';

  const {
    source = undefined,
    title = undefined,
    to = undefined,
  } = defineProps<{
    source?: SourceResponse;
    title?: string;
    to?: RouteLocationRaw;
    isOpened?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'open-drawer' | 'navigate'): void;
  }>();

  const { isDesktop } = useDevice();

  function handleClick() {
    if (isDesktop) {
      return emit('open-drawer');
    }

    navigateTo(to);

    return emit('navigate');
  }
</script>

<template>
  <NuxtLink
    v-slot="{ href }"
    v-memo="[to, isOpened]"
    custom
    :to
  >
    <a
      :href
      @click.exact.prevent.stop="handleClick"
    >
      <div
        class="flex min-h-12.5 w-full items-center gap-3 rounded-xl border px-3 py-1.5 transition-all"
        :class="
          isOpened
            ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/50'
            : 'border-default bg-elevated hover:border-accented hover:bg-accented'
        "
      >
        <div
          v-if="$slots.icon"
          class="-ml-2 flex size-11 shrink-0 items-center justify-center border-r border-inherit"
        >
          <div
            class="text-center text-base leading-none transition-colors"
            :class="{ 'text-primary': isOpened }"
          >
            <slot name="icon" />
          </div>
        </div>

        <div
          class="flex flex-auto flex-col justify-center gap-1 overflow-hidden"
        >
          <div class="flex items-center justify-between gap-1">
            <span
              :title
              class="inline-block w-full overflow-hidden text-nowrap text-ellipsis"
            >
              <span class="inline max-w-full text-highlighted">
                <slot name="default" />
              </span>

              <span
                v-if="$slots.english"
                class="inline"
              >
                [<slot name="english" />]
              </span>
            </span>

            <div
              v-if="source"
              class="shrink-0"
            >
              <SourceTag
                :source
                show-tooltip
              />
            </div>
          </div>

          <div
            v-if="$slots.caption"
            class="flex w-full min-w-0 items-center gap-1 overflow-hidden text-nowrap text-ellipsis"
          >
            <span
              class="block w-full overflow-hidden text-nowrap text-ellipsis"
            >
              <slot name="caption" />
            </span>
          </div>
        </div>
      </div>
    </a>
  </NuxtLink>
</template>
