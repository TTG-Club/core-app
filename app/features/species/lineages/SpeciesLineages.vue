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
      :ui="{
        root: 'px-4 py-3 flex flex-col gap-4 rounded bg-elevated/65 hover:bg-elevated/75 transition-bg duration-150 ease-in-out',
      }"
    >
      <template #default="{ open }">
        <h4
          class="flex cursor-pointer items-center justify-between text-xl font-semibold"
        >
          <span>
            {{ species.name.rus }}
          </span>

          <UIcon
            name="i-fluent-chevron-down-16-regular"
            class="transition-transform duration-150 ease-in-out"
            :class="open ? '-rotate-180' : ''"
          />
        </h4>
      </template>

      <template #content>
        <SpeciesBody :species />
      </template>
    </UCollapsible>
  </div>
</template>
