<script setup lang="ts">
  import { useCopy } from '~/shared/composables';

  const { name } = defineProps<{
    name?:
      | string
      | {
          rus: string;
          eng?: string;
        };
  }>();

  const { copy } = useCopy();

  const nameForCopy = computed(() => {
    if (!name) {
      return '';
    }

    if (typeof name === 'string') {
      return name;
    }

    let str = name.rus;

    if (name.eng) {
      str += ` [${name.eng}]`;
    }

    return str;
  });
</script>

<template>
  <Transition
    name="fade"
    mode="out-in"
  >
    <span
      v-if="name"
      :class="$style.name"
      @click="copy(nameForCopy)"
    >
      <span v-if="typeof name === 'string'">{{ name }}</span>

      <template v-else>
        <span>{{ name.rus }}</span>

        <span v-if="name.eng"> [{{ name.eng }}]</span>
      </template>
    </span>

    <ASkeleton
      v-else
      :paragraph="{ rows: 1 }"
      :avatar="false"
      :title="false"
      active
    />
  </Transition>
</template>

<style module lang="scss">
  .title {
    overflow: hidden;
    flex: 1 1 100%;
  }

  .name {
    overflow: hidden;
    display: inline-block;

    width: 100%;

    text-overflow: ellipsis;
    white-space: nowrap;

    span {
      display: inline;
      max-width: 100%;
    }
  }

  .tags {
    flex-shrink: 0;
  }
</style>
