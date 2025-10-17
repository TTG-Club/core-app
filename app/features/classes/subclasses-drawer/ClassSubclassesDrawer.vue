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
    title="Подклассы"
    class="w-md"
    :is-loading
    :is-error
    @close="$emit('close')"
  >
    <div class="@container grid gap-3">
      <ClassLink
        v-for="link in subclasses"
        :key="link.url"
        :character-class="link"
      >
        {{ link.url }}
      </ClassLink>
    </div>
  </UiDrawer>
</template>
