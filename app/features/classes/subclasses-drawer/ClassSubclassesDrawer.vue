<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';

  import { ClassLink } from '~classes/link';
  import type { ClassLinkResponse } from '~classes/types';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: subclasses, status } = await useAsyncData(
    computed(() => `class-${url}-subclasses`),
    () => $fetch<Array<ClassLinkResponse>>(`/api/v2/classes/${url}/subclasses`),
    {
      server: false,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
</script>

<template>
  <UiDrawer
    title="Происхождения"
    :is-loading
    :is-error
    @close="$emit('close')"
  >
    <div :class="$style.container">
      <div :class="$style.grid">
        <ClassLink
          v-for="link in subclasses"
          :key="link.url"
          :character-class="link"
        >
          {{ link.url }}
        </ClassLink>
      </div>
    </div>
  </UiDrawer>
</template>

<style module lang="scss">
  .grid {
    display: grid;
    grid-gap: 16px;
    grid-template-columns: repeat(1, 248px);

    @include media-min($sm) {
      grid-template-columns: repeat(2, 248px);
    }
  }
</style>
