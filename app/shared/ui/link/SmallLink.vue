<script setup lang="ts">
  import { GroupTag } from '../source-tag';

  import type { RouteLocationRaw } from 'vue-router';
  import type { SourceGroupResponse } from '~/shared/types';

  const {
    group = undefined,
    title = undefined,
    to = undefined,
  } = defineProps<{
    group?: SourceGroupResponse;
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
    v-memo="[to]"
    custom
    :to
  >
    <a
      :href
      @click.exact.prevent.stop="handleClick"
    >
      <div
        class="flex min-h-12.5 w-full items-center gap-3 rounded-xl border border-default px-3 py-1.5 hover:bg-elevated/50"
        :class="isOpened ? 'bg-accented' : 'bg-elevated'"
      >
        <div
          v-if="$slots.icon"
          class="-ml-2 flex size-11 shrink-0 items-center justify-center border-r border-default"
        >
          <div class="text-center text-base leading-none">
            <slot name="icon" />
          </div>
        </div>

        <div
          class="flex flex-auto flex-col justify-center gap-1 overflow-hidden"
        >
          <div class="flex items-center justify-between gap-1">
            <span
              :title
              class="inline-block w-full overflow-hidden text-nowrap text-ellipsis text-(--color-text-gray)"
            >
              <span class="inline max-w-full text-(--color-text-title)">
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
              v-if="group"
              class="shrink-0"
            >
              <GroupTag :group="group" />
            </div>
          </div>

          <div
            v-if="$slots.caption"
            class="flex items-center gap-1"
          >
            <slot name="caption" />
          </div>
        </div>
      </div>
    </a>
  </NuxtLink>
</template>
