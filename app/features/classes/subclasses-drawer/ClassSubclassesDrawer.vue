<script setup lang="ts">
  import type { ClassLinkResponse } from '../model';

  import { ClassLink } from '~classes/link';
  import { UiDrawer } from '~ui/drawer';

  import { useSubclassSourceFilter } from '../composable';

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

  // Источники, выбранные в фильтре раздела, сужают и подклассы
  const { visibleSubclasses, hiddenLabel } =
    useSubclassSourceFilter(subclasses);

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
        v-for="link in visibleSubclasses"
        :key="link.url"
        :character-class="link"
        hide-image-on-mobile
      >
        {{ link.url }}
      </ClassLink>

      <p
        v-if="hiddenLabel"
        class="text-xs text-muted"
      >
        {{ hiddenLabel }}
      </p>
    </div>
  </UiDrawer>
</template>
