<script setup lang="ts">
  import { GroupTag } from '~/shared/ui';
  import type { SourceGroupResponse } from '~/shared/types';

  const { group } = defineProps<{
    group?: SourceGroupResponse;
  }>();
</script>

<template>
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
        <span :class="$style.label">
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
</template>

<style module lang="scss">
  .link {
    width: 100%;
    min-height: 38px;
    padding: 6px 12px;
    border-radius: 12px;

    color: var(--color-text);

    background: var(--color-bg-secondary);

    &:hover {
      background-color: var(--color-hover);
    }

    & {
      @include css-anim();
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
