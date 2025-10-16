<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';

  import { SubClassLink } from '~classes/link';
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
    title="Подклассы"
    :is-loading
    :is-error
    @close="$emit('close')"
  >
    <div :class="$style.container">
      <div :class="$style.grid">
        <SubClassLink
          v-for="link in subclasses"
          :key="link.url"
          :character-class="link"
        >
          {{ link.url }}
        </SubClassLink>
      </div>
    </div>
  </UiDrawer>
</template>

<style module lang="scss">
  .grid {
    display: grid;
    grid-gap: 16px;
  }
</style>
