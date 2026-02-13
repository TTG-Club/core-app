<script setup lang="ts">
  import { SpeciesLink } from '~species/link';
  import { UiDrawer } from '~ui/drawer';

  import type { SpeciesLinkResponse } from '~species/model';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data, status } = await useAsyncData(
    computed(() => `species-${url}-lineages`),
    () =>
      $fetch<Array<SpeciesLinkResponse>>(
        `/api/v2/species/${url}/lineages/search`,
      ),
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
    class="w-md"
    :is-loading
    :is-error
    @close="$emit('close')"
  >
    <div class="@container grid gap-3">
      <SpeciesLink
        v-for="link in data"
        :key="link.url"
        :species="link"
        hide-image-on-mobile
      >
        {{ link.url }}
      </SpeciesLink>
    </div>
  </UiDrawer>
</template>
