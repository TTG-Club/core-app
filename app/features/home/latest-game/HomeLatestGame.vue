<script setup lang="ts">
  import { maxBy } from 'es-toolkit';

  import { useParticipantNames } from '~find-game/composables';
  import {
    createEmptyGameFilter,
    fetchGames,
    GAMES_ROUTE,
  } from '~find-game/model';
  import { HomePanel } from '~home/ui-kit';

  import {
    HOME_LATEST_GAME_ALL_LABEL,
    HOME_LATEST_GAME_DATA_KEY,
    HOME_LATEST_GAME_EMPTY_TEXT,
    HOME_LATEST_GAME_ERROR_TEXT,
    HOME_LATEST_GAME_ICON,
    HOME_LATEST_GAME_LABEL,
    HOME_LATEST_GAME_LOOKUP_PAGE,
    HOME_LATEST_GAME_LOOKUP_SIZE,
  } from './model';
  import { HomeLatestGameCard } from './ui';

  // Клиентская загрузка, как у новостей: блок ниже сгиба и не должен держать
  // ответ главной в ожидании сервиса игр.
  const { data: gamesPage, status } = await useAsyncData(
    HOME_LATEST_GAME_DATA_KEY,
    () =>
      fetchGames(
        createEmptyGameFilter(),
        HOME_LATEST_GAME_LOOKUP_PAGE,
        HOME_LATEST_GAME_LOOKUP_SIZE,
      ),
    { lazy: true, server: false },
  );

  /**
   * Последняя созданная игра. Выдача каталога упорядочена по позиции в
   * списке, а не по дате создания (поднятая игра встаёт наверх), поэтому
   * самую свежую выбираем сами — см. `HOME_LATEST_GAME_LOOKUP_SIZE`.
   */
  const latestGame = computed(
    () =>
      maxBy(gamesPage.value?.content ?? [], (game) =>
        Date.parse(game.createdAt),
      ) ?? null,
  );

  // idle тоже считаем загрузкой: при server:false до клиентского запроса
  // статус 'idle', и без этого на мгновение мелькала бы заглушка «игр нет».
  const isLoading = computed(
    () =>
      (status.value === 'pending' || status.value === 'idle')
      && !latestGame.value,
  );

  // Ошибка и пустой каталог показываются одной заглушкой, но разным текстом:
  // прятать панель, как новости, нельзя — без неё в ряду со статьями дыра.
  const placeholderText = computed(() =>
    status.value === 'error'
      ? HOME_LATEST_GAME_ERROR_TEXT
      : HOME_LATEST_GAME_EMPTY_TEXT,
  );

  const { getParticipantName, watchParticipantNames } = useParticipantNames();

  // Имя мастера живёт в core-api: сервис игр знает только идентификатор.
  watchParticipantNames(() =>
    latestGame.value ? [latestGame.value.masterId] : [],
  );
</script>

<template>
  <!--
    Панель не `fill`: высота карточки участвует в высоте ряда, поэтому она
    никогда не обрезается. С xl ряд тянет панель до низа соседей — VTTG и
    соцсетей (см. `pages/index.vue`), и разницу забирает обложка, а не
    пустота над подвалом.
  -->
  <HomePanel
    :label="HOME_LATEST_GAME_LABEL"
    :icon="HOME_LATEST_GAME_ICON"
    :to="GAMES_ROUTE"
    :link-label="HOME_LATEST_GAME_ALL_LABEL"
    body-class="flex flex-1 flex-col p-0"
  >
    <!-- Скелетон повторяет карточку — обложку и две строки, — чтобы ряд не
      прыгал, когда игра приедет -->
    <div
      v-if="isLoading"
      class="flex flex-1 flex-col"
    >
      <USkeleton
        class="aspect-video w-full rounded-none sm:aspect-3/1 xl:aspect-auto xl:min-h-32 xl:flex-1"
      />

      <div class="flex flex-col gap-2 p-3">
        <div class="flex items-center justify-between gap-2">
          <USkeleton class="h-5 w-1/2 rounded-md" />

          <USkeleton class="h-5 w-20 rounded-md" />
        </div>

        <USkeleton class="h-5 w-3/4 rounded-md" />
      </div>
    </div>

    <HomeLatestGameCard
      v-else-if="latestGame"
      :game="latestGame"
      :master-name="getParticipantName(latestGame.masterId)"
    />

    <p
      v-else
      class="m-3 flex flex-1 items-center justify-center rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ placeholderText }}
    </p>
  </HomePanel>
</template>
