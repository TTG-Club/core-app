<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~species/model';

  import { SpeciesLink } from '~species/link';
  import { UiDrawer } from '~ui/drawer';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  // Ключ отличается от ключа `SpeciesLineages`: тот тянет полные детали
  // происхождений, а дровер — короткие ссылки. С общим ключом Nuxt оставлял
  // обработчик того, кто смонтировался первым, и второй получал чужую форму
  // ответа: открыв сперва дровер, детальник вида показывал происхождения без
  // описаний и умений — в ссылках этих полей нет.
  const { data, status } = await useAsyncData(
    computed(() => `species-${url}-lineages-links`),
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
