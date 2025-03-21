<script setup lang="ts">
  import { useCopy } from '~/shared/composables';
  import type { DrawerTitleName } from './types';

  const { title, copyTitle = false } = defineProps<{
    title: DrawerTitleName;
    copyTitle?: boolean;
  }>();

  const { copy } = useCopy();

  function handleCopy(text: string) {
    if (!copyTitle) {
      return;
    }

    copy(text);
  }

  function preventSelect(e: Event) {
    if (!copyTitle) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  }
</script>

<template>
  <AFlex
    v-if="title"
    :class="$style.name"
    align="flex-start"
    gap="8"
    vertical
  >
    <span
      v-if="typeof title === 'string'"
      :class="[$style.rus, { [$style.copy]: copyTitle }]"
      @click="handleCopy(title)"
      @selectstart="preventSelect"
      @select="preventSelect"
    >
      {{ title }}
    </span>

    <template v-else>
      <span
        :class="[$style.rus, { [$style.copy]: copyTitle }]"
        @click="handleCopy(title.rus)"
        @selectstart="preventSelect"
        @select="preventSelect"
      >
        {{ title.rus }}
      </span>

      <span
        v-if="title.eng"
        :class="[$style.eng, { [$style.copy]: copyTitle }]"
        @click="handleCopy(title.eng)"
        @selectstart="preventSelect"
        @select="preventSelect"
      >
        {{ title.eng }}
      </span>
    </template>
  </AFlex>

  <ASkeleton
    v-else
    :paragraph="{ rows: 2 }"
    :avatar="false"
    :title="false"
    active
  />
</template>

<style module lang="scss">
  .title {
    overflow: hidden;
    flex: 1 1 100%;
  }

  .name {
    width: 100%;

    .rus,
    .eng {
      overflow: hidden;
      display: inline-block;

      max-width: 100%;

      text-overflow: ellipsis;
      white-space: nowrap;

      &.copy {
        cursor: pointer;
      }
    }

    .rus {
      font-size: 16px;
      line-height: 24px;
    }

    .eng {
      font-size: 12px;
      font-weight: 400;
      line-height: 22px;
    }
  }

  .tags {
    flex-shrink: 0;
  }
</style>
