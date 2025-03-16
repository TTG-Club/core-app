<script setup lang="ts">
  import { useCopy } from '~/shared/composables';
  import type { DrawerTitleName } from './types';

  const { title } = defineProps<{
    title: DrawerTitleName;
  }>();

  const { copy } = useCopy();
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
      :class="$style.rus"
      @click="copy(title)"
    >
      {{ title }}
    </span>

    <template v-else>
      <span
        :class="$style.rus"
        @click="copy(title.rus)"
      >
        {{ title.rus }}
      </span>

      <span
        v-if="title.eng"
        :class="$style.eng"
        @click="copy(title.eng)"
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
