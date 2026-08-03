<script setup lang="ts">
  import type { SpeciesDetailResponse } from '~species/model';

  import { SpeciesBody } from '~species/body';
  import { UiCollapse } from '~ui/collapse';

  const { url } = defineProps<{
    url: SpeciesDetailResponse['url'];
  }>();

  // Ключ реактивный: в детальнике и дровере компонент переиспользуется при
  // переходе между видами, и со статичным ключом список остаётся от вида,
  // открытого первым.
  const { data: lineages, status } = await useAsyncData(
    computed(() => `species-${url}-lineages`),
    () =>
      $fetch<Array<SpeciesDetailResponse>>(`/api/v2/species/${url}/lineages`),
  );

  // При смене ключа Nuxt переносит данные прошлого вида в новый ключ, поэтому
  // до ответа список прячем — иначе мелькают чужие происхождения.
  const isLoading = computed(() => status.value === 'pending');
</script>

<template>
  <div
    v-if="!isLoading && lineages?.length"
    class="flex flex-col gap-4"
  >
    <h3 class="text-xl font-semibold">Происхождения</h3>

    <UiCollapse
      v-for="species in lineages"
      :key="species.url"
    >
      <template #default>
        {{ species.name.rus }}
      </template>

      <template #content>
        <SpeciesBody
          :species
          hide-left-block
        />
      </template>
    </UiCollapse>
  </div>
</template>
