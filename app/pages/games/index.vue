<script setup lang="ts">
  import { PolymorpherGameCard } from '~/features/games';

  const { games, page, size, search, status, error, refresh, totalElements } =
    usePolymorpher();

  const isPending = computed(() => status.value === 'pending');

  const isEmpty = computed(
    () => status.value === 'success' && games.value.length === 0,
  );

  watch(search, () => {
    page.value = 1;
  });
</script>

<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
    <div
      class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold text-highlighted">Polymorpher</h1>

        <p class="text-sm text-toned">Найди свою игру</p>
      </div>

      <div class="w-full md:w-96">
        <UInput
          v-model="search"
          placeholder="Поиск по названию или системе"
        />
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Не удалось загрузить игры"
      :description="error.message"
    >
      <template #actions>
        <UButton
          variant="subtle"
          @click="refresh()"
        >
          Повторить
        </UButton>
      </template>
    </UAlert>

    <div
      v-if="isPending"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <USkeleton
        v-for="index in size"
        :key="index"
        class="h-[420px] rounded-2xl"
      />
    </div>

    <div
      v-else-if="isEmpty"
      class="rounded-2xl border border-default bg-elevated p-8 text-center text-toned"
    >
      Ничего не найдено
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <PolymorpherGameCard
        v-for="game in games"
        :key="game.id"
        :game="game"
      />
    </div>

    <div
      v-if="totalElements > size"
      class="flex justify-center"
    >
      <UPagination
        v-model:page="page"
        :items-per-page="size"
        :total="totalElements"
      />
    </div>
  </div>
</template>
