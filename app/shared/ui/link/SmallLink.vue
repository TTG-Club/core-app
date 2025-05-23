<script setup lang="ts">
  import { GroupTag } from '../source-tag';

  import type { RouteLocationRaw } from 'vue-router';
  import type { SourceGroupResponse } from '~/shared/types';

  const { group, to } = defineProps<{
    group?: SourceGroupResponse;
    title?: string;
    to?: RouteLocationRaw;
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
      <AFlex
        :class="$style.link"
        :gap="12"
        align="center"
      >
        <AFlex
          v-if="$slots.icon"
          :class="$style.icon"
          justify="center"
          align="center"
        >
          <slot name="icon" />
        </AFlex>

        <AFlex
          :class="$style.body"
          :gap="4"
          justify="center"
          vertical
        >
          <AFlex
            :class="$style.main"
            :gap="4"
            justify="space-between"
            align="center"
          >
            <span
              :class="$style.label"
              :title
            >
              <span :class="$style.rus">
                <slot name="default" />
              </span>

              <span
                v-if="$slots.english"
                :class="$style.eng"
              >
                [<slot name="english" />]
              </span>
            </span>

            <div
              v-if="group"
              :class="$style.tag"
            >
              <GroupTag :group="group" />
            </div>
          </AFlex>

          <AFlex
            v-if="$slots.caption"
            :gap="4"
            align="center"
          >
            <slot name="caption" />
          </AFlex>
        </AFlex>
      </AFlex>
    </a>
  </NuxtLink>
</template>

<style module lang="scss">
  .link {
    width: 100%;
    min-height: 38px;
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: 12px;

    color: var(--color-text);

    background-color: var(--color-bg-secondary);

    & {
      @include css-anim();
    }

    &:hover {
      background-color: var(--color-hover);
    }
  }

  .icon {
    flex-shrink: 0;

    width: 42px;
    height: 42px;
    margin-left: -8px;
    border-right: 1px solid var(--color-border);

    font-size: 16px;
    line-height: 16px;
    color: var(--color-text);
    text-align: center;
  }

  .body {
    overflow: hidden;
    flex: 1 1 100%;
  }

  .label {
    overflow: hidden;
    display: inline-block;

    width: 100%;

    color: var(--color-text-gray);
    text-overflow: ellipsis;
    white-space: nowrap;

    .rus {
      display: inline;
      max-width: 100%;
      color: var(--color-text-title);
    }

    .eng {
      display: inline;
    }
  }

  .tag {
    flex-shrink: 0;
    margin: 0;
  }
</style>
