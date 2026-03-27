<script setup lang="ts">
  import type { PolymorpherGamesResponse } from '~/shared/types/polymorpher';
  import type { LegendItems } from '~ui/page';

  import { PolymorpherGameCard } from '~games';
  import { FilterControls } from '~infrastructure/filter';
  import { PageGrid, PageLegend, PageResult } from '~ui/page';
  import { SkeletonLinkBig } from '~ui/skeleton';

  useSeoMeta({
    title: 'Игры с Polymorpher',
    description: 'Подборка открытых игр с Polymorpher.',
  });

  const size = 64;

  const search = ref<string>('');

  const {
    data: response,
    status,
    error,
    refresh,
  } = await useAsyncData(
    'polymorpher-games',
    () =>
      $fetch<PolymorpherGamesResponse>('/api/polymorpher/games', {
        method: 'GET',
        query: {
          search: search.value.trim() || undefined,
          page: 0,
          size,
        },
      }),
    {
      deep: false,
      watch: [search],
      default: () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size,
        page: 0,
      }),
    },
  );

  const games = computed(() => response.value?.content ?? []);

  const legends: LegendItems = [
    {
      label: 'R',
      title: 'Платные игры',
    },
    {
      label: 'M',
      title: 'Игры за внутриигровую валюту',
    },
  ];
</script>

<template>
  <NuxtLayout
    name="section"
    title="Игры"
  >
    <template #controls>
      <FilterControls v-model:search="search">
        <template #legend> <PageLegend :items="legends" /> </template
      ></FilterControls>
    </template>

    <template #default>
      <div class="space-y-4">
        <Transition
          name="fade"
          mode="out-in"
        >
          <PageGrid v-if="status === 'pending'">
            <SkeletonLinkBig
              v-for="index in size"
              :key="index"
            />
          </PageGrid>

          <PageGrid v-else-if="status === 'success' && games.length">
            <template
              v-for="game in games"
              :key="game.id"
            >
              <PolymorpherGameCard :game="game" />
            </template>
          </PageGrid>

          <PageResult
            v-else
            :items="games"
            :status="status"
            :error="error ?? undefined"
            @refresh="refresh"
          />
        </Transition>
      </div>
    </template>
  </NuxtLayout>
</template>
