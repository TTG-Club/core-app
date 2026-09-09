<script setup lang="ts">
  import {
    CATALOG_RETRY_LABEL,
    fetchMyGames,
    getFindGameErrorMessage,
    getGameRoute,
    getNextSessionLabel,
    MY_GAMES_ATTENTION_ACTION,
    MY_GAMES_ATTENTION_EMPTY,
    MY_GAMES_ATTENTION_LABEL,
    MY_GAMES_ERROR_TITLE,
    MY_GAMES_OVERVIEW_SIZE,
    MY_GAMES_UPCOMING_EMPTY,
    MY_GAMES_UPCOMING_LABEL,
  } from '../../model';

  const {
    data: overview,
    status,
    error,
    refresh,
  } = useAsyncData(
    'find-game-personal-overview',
    async () => {
      const [upcoming, attention] = await Promise.all([
        fetchMyGames(0, MY_GAMES_OVERVIEW_SIZE, [], 'UPCOMING'),
        fetchMyGames(0, MY_GAMES_OVERVIEW_SIZE, [], 'ATTENTION'),
      ]);

      return { upcoming, attention };
    },
    { server: false, deep: false },
  );

  const sections = computed(() =>
    [
      {
        key: 'upcoming',
        title: MY_GAMES_UPCOMING_LABEL,
        empty: MY_GAMES_UPCOMING_EMPTY,
        games: overview.value?.upcoming.content ?? [],
        total: overview.value?.upcoming.totalElements ?? 0,
      },
      {
        key: 'attention',
        title: MY_GAMES_ATTENTION_LABEL,
        empty: MY_GAMES_ATTENTION_EMPTY,
        games: overview.value?.attention.content ?? [],
        total: overview.value?.attention.totalElements ?? 0,
      },
    ].map((section) => ({
      ...section,
      games: section.games.map((game) => ({
        id: game.id,
        title: game.title,
        to: getGameRoute(game.id),
        description:
          section.key === 'upcoming'
            ? getNextSessionLabel(game.nextSession)
            : MY_GAMES_ATTENTION_ACTION,
      })),
    })),
  );
</script>

<template>
  <UAlert
    v-if="status === 'error'"
    color="error"
    :title="MY_GAMES_ERROR_TITLE"
    :description="getFindGameErrorMessage(error)"
  >
    <template #actions
      ><UButton
        :label="CATALOG_RETRY_LABEL"
        @click.left.exact.prevent="refresh()"
    /></template>
  </UAlert>

  <div
    v-else
    class="grid gap-4 lg:grid-cols-2"
  >
    <UCard
      v-for="section in sections"
      :key="section.key"
    >
      <template #header
        ><h2 class="font-semibold text-highlighted">
          {{ section.title }} · {{ section.total }}
        </h2></template
      >

      <USkeleton
        v-if="status !== 'success'"
        class="h-20 w-full"
      />

      <ul
        v-else-if="section.games.length"
        class="flex flex-col gap-3"
      >
        <li
          v-for="game in section.games"
          :key="game.id"
        >
          <ULink
            :to="game.to"
            class="font-medium text-primary"
            >{{ game.title }}</ULink
          >

          <p class="text-sm text-muted">{{ game.description }}</p>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        {{ section.empty }}
      </p>
    </UCard>
  </div>
</template>
