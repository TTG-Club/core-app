<script setup lang="ts">
  import type { Game } from '~find-game/model';

  import {
    GAME_COST_TYPE_COLORS,
    GAME_COST_TYPE_ICONS,
    GAME_COST_TYPE_LABELS,
    GAME_MASTER_LABEL,
    GAME_NEXT_SESSION_EMPTY,
    GAME_NEXT_SESSION_SHORT_DATE_FORMAT,
    GAME_NEXT_SESSION_SHORT_LABEL,
    GAME_SEATS_LABEL,
    GAME_SYSTEM_LABELS,
    GAME_TYPE_ICONS,
    getGameFormatSummary,
    getGameRoute,
    getGameSeatsCounter,
    getGameSeatsHint,
  } from '~find-game/model';
  import { GameCover } from '~find-game/ui';

  const { game, masterName } = defineProps<{
    game: Game;
    /** Имя мастера: сервис игр знает только идентификатор, имя резолвит родитель */
    masterName: string;
  }>();

  const { format } = useDayjs();

  const gameRoute = computed(() => getGameRoute(game.id));

  const costBadgeColor = computed(() => GAME_COST_TYPE_COLORS[game.costType]);

  const costBadgeIcon = computed(() => GAME_COST_TYPE_ICONS[game.costType]);

  const costLabel = computed(() => GAME_COST_TYPE_LABELS[game.costType]);

  const formatIcon = computed(() => GAME_TYPE_ICONS[game.type]);

  const formatSummary = computed(() => getGameFormatSummary(game));

  const systemLabel = computed(() => GAME_SYSTEM_LABELS[game.system]);

  /**
   * Своей даты у игры нет — время назначается встречам, поэтому показываем
   * ближайшую. Пока расписания нет, подпись говорит об этом прямо.
   */
  const nextSessionLabel = computed(() => {
    const startsAt = game.nextSession?.startsAt;

    return startsAt
      ? format(startsAt, GAME_NEXT_SESSION_SHORT_DATE_FORMAT)
      : GAME_NEXT_SESSION_EMPTY;
  });

  /** Назначенная дата выделена, неназначенная приглушена */
  const nextSessionClass = computed(() =>
    game.nextSession?.startsAt ? 'text-toned' : 'text-muted',
  );

  /** Подпись «Мастер» в строке заменена короной — полное имя остаётся в подсказке */
  const masterHint = computed(() => `${GAME_MASTER_LABEL}: ${masterName}`);

  const seatsHint = computed(() => getGameSeatsHint(game));

  const seatsCounter = computed(() => getGameSeatsCounter(game));
</script>

<template>
  <!--
    Карточка целиком — одна ссылка на объявление: внутри нет своих кнопок,
    поэтому подложка-ссылка, как в каталоге, здесь не нужна.

    С xl ряд тянет панель до низа соседей, и разницу забирает обложка
    (`flex-1` поверх `min-h`). Ниже xl ряда нет — обложка живёт по своим
    пропорциям.
  -->
  <NuxtLink
    :to="gameRoute"
    class="group flex flex-1 flex-col no-underline"
  >
    <div
      class="relative aspect-video overflow-hidden sm:aspect-3/1 xl:aspect-auto xl:min-h-32 xl:flex-1"
    >
      <!-- Обложка вынута в слой: так она заполняет рамку любой пропорции, а
        не навязывает свои 16:9 (и заглушка остаётся по центру) -->
      <div class="absolute inset-0">
        <GameCover
          :image-url="game.imageUrl"
          :alt="game.title"
          :game-type="game.type"
          class="h-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-black/5"
      />

      <UBadge
        class="absolute top-2 right-2"
        size="sm"
        variant="solid"
        :color="costBadgeColor"
        :icon="costBadgeIcon"
        :label="costLabel"
      />

      <!-- Жанр переехал сюда из тела карточки: по смыслу он из той же строки
        «какая это игра», что формат и длительность -->
      <div
        class="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 pb-2.5 text-xs font-medium text-white"
      >
        <UIcon
          :name="formatIcon"
          class="size-4 shrink-0"
        />

        <span class="truncate [text-shadow:0_1px_3px_#000000a6]">
          {{ formatSummary }}

          <template v-if="game.genre">
            <span
              aria-hidden="true"
              class="text-white/50"
            >
              ·
            </span>

            {{ game.genre }}
          </template>
        </span>
      </div>
    </div>

    <!--
      Две строки вместо четырёх: название и система разнесены по краям, а
      дата, мастер и места идут одной строкой значков. Подписи к значкам
      остались для скринридера (`sr-only`) и в подсказках.
    -->
    <div class="flex flex-col gap-2 p-3">
      <div class="flex items-start justify-between gap-2">
        <h3
          class="line-clamp-2 min-w-0 text-base leading-snug font-semibold text-highlighted transition-colors group-hover:text-primary"
        >
          {{ game.title }}
        </h3>

        <UBadge
          class="mt-0.5 shrink-0"
          color="primary"
          variant="subtle"
          size="sm"
          :label="systemLabel"
        />
      </div>

      <div class="flex items-center gap-3 text-sm text-muted">
        <span class="flex shrink-0 items-center gap-1.5">
          <UIcon
            name="tabler:calendar-event"
            class="size-4 shrink-0"
          />

          <span class="sr-only">{{ GAME_NEXT_SESSION_SHORT_LABEL }}:</span>

          <span
            class="font-medium"
            :class="nextSessionClass"
          >
            {{ nextSessionLabel }}
          </span>
        </span>

        <span
          class="flex min-w-0 items-center gap-1.5"
          :title="masterHint"
        >
          <UIcon
            name="tabler:crown"
            class="size-4 shrink-0"
          />

          <span class="sr-only">{{ GAME_MASTER_LABEL }}:</span>

          <span class="truncate font-medium text-toned">{{ masterName }}</span>
        </span>

        <span
          class="ml-auto flex shrink-0 items-center gap-1.5 tabular-nums"
          :title="seatsHint"
        >
          <UIcon
            name="tabler:user"
            class="size-4 shrink-0"
          />

          <span class="sr-only">{{ GAME_SEATS_LABEL }}:</span>

          {{ seatsCounter }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
