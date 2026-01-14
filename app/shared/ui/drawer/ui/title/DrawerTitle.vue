<script setup lang="ts">
  import type { DrawerTitleName } from './types';

  const { title, copyTitle = false } = defineProps<{
    title: DrawerTitleName;
    copyTitle?: boolean;
  }>();

  const { copy } = useCopyAndShare();

  function preventSelect(e: Event) {
    if (!copyTitle) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  }
</script>

<template>
  <div
    v-if="title"
    class="flex flex-col items-start gap-2"
    :class="$style.name"
  >
    <span
      v-if="typeof title === 'string'"
      :class="[$style.rus, { [$style.copy]: copyTitle }]"
      @click.left.exact.prevent="copy(title)"
      @selectstart="preventSelect"
      @select="preventSelect"
    >
      {{ title }}
    </span>

    <template v-else>
      <span
        :class="[$style.rus, { [$style.copy]: copyTitle }]"
        @click.left.exact.prevent="copy(title.rus)"
        @selectstart="preventSelect"
        @select="preventSelect"
      >
        {{ title.rus }}
      </span>

      <span
        v-if="title.eng"
        :class="[$style.eng, { [$style.copy]: copyTitle }]"
        @click.left.exact.prevent="copy(title.eng)"
        @selectstart="preventSelect"
        @select="preventSelect"
      >
        {{ title.eng }}
      </span>
    </template>
  </div>

  <USkeleton
    v-else
    class="h-8 w-1/3"
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
