<script setup lang="ts">
  import { SpeciesBody } from '~species/body';

  import type { SpeciesDetailResponse } from '~/shared/types';

  const { url } = defineProps<{
    url: SpeciesDetailResponse['url'];
  }>();

  const { data: lineages } = await useAsyncData(`species-${url}-lineages`, () =>
    $fetch<Array<SpeciesDetailResponse>>(`/api/v2/species/${url}/lineages`),
  );
</script>

<template>
  <div
    v-if="lineages?.length"
    class="flex flex-col gap-4"
  >
    <h3 class="text-xl font-semibold">Происхождения</h3>

    <UCollapsible
      v-for="species in lineages"
      :key="species.url"
    >
      <template #default="{ open }">
        <h4
          class="flex cursor-pointer items-center gap-4 text-xl font-semibold"
        >
          <UIcon
            name="i-fluent-chevron-down-16-regular"
            class="transition-transform duration-150 ease-in-out"
            :class="open ? '-rotate-180' : ''"
          />

          <span>
            {{ species.name.rus }}
          </span>
        </h4>
      </template>

      <template #content>
        <SpeciesBody :species />
      </template>
    </UCollapsible>
  </div>
</template>
