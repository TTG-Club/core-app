<script setup lang="ts">
  import type { BadgeProps } from '@nuxt/ui';

  import type { Game } from '../../model';

  import { useMasterProfileDrawer } from '../../composables';
  import {
    GAME_CARD_BADGE_LIMIT,
    GAME_COST_TYPE_LABELS,
    GAME_DURATION_TYPE_LABELS,
    GAME_MASTER_LABEL,
    GAME_SEATS_MAX_ICONS,
    GAME_STATUS_COLORS,
    GAME_STATUS_LABELS,
    GAME_SYSTEM_LABELS,
    GAME_VISIBILITY_LABELS,
    getGameFormatLabel,
    getGameRoute,
    getGameSeatsCounter,
    getGameSeatsHint,
    MASTER_PROFILE_OPEN_HINT,
  } from '../../model';
  import { GameCover } from '../../ui';

  const {
    game,
    masterName,
    showStatus = false,
  } = defineProps<{
    game: Game;
    /**
     * Имя мастера. Резолвится списком в родителе: find-game-api знает только
     * идентификатор, а по карточке на запрос вышло бы восемь запросов на
     * страницу.
     */
    masterName: string;
    /** Показывать ли статус и видимость — нужно в разделе «Мои игры». */
    showStatus?: boolean;
  }>();

  // Код приглашения в ссылку каталога не подставляется: в публичную выдачу
  // приватные игры не попадают, а у своих игр мастер открывает ссылку отдельно.
  const gameRoute = computed(() => getGameRoute(game.id));

  const isFree = computed(() => game.costType === 'FREE');

  /**
   * Значки карточки. Их ровно столько, сколько влезает в две строки: карточка
   * одной высоты у всех игр, а лишнее видно на странице игры. Первыми идут
   * статус и видимость — в «Моих играх» они важнее всего остального.
   */
  const badges = computed<
    Array<{ key: string; label: string; color: BadgeProps['color'] }>
  >(() => {
    const items: Array<{
      key: string;
      label: string;
      color: BadgeProps['color'];
    }> = [];

    if (showStatus) {
      items.push({
        key: 'status',
        label: GAME_STATUS_LABELS[game.status],
        color: GAME_STATUS_COLORS[game.status],
      });

      if (game.visibility === 'PRIVATE') {
        items.push({
          key: 'visibility',
          label: GAME_VISIBILITY_LABELS.PRIVATE,
          color: 'neutral',
        });
      }
    }

    items.push(
      {
        key: 'system',
        label: GAME_SYSTEM_LABELS[game.system],
        color: 'primary',
      },
      {
        key: 'format',
        label: getGameFormatLabel(game),
        color: 'primary',
      },
      {
        key: 'duration',
        label: GAME_DURATION_TYPE_LABELS[game.durationType],
        color: 'primary',
      },
    );

    if (game.genre) {
      items.push({ key: 'genre', label: game.genre, color: 'primary' });
    }

    return items.slice(0, GAME_CARD_BADGE_LIMIT);
  });

  /**
   * Места в ближайшей сессии, по одному значку на место. Три состояния
   * различаются видом: подтверждённое мастером место — залитый цветной
   * значок, место с неразобранной заявкой — цветной контурный, свободное до
   * минимума для старта — контурный, свободное сверх минимума — контурный
   * приглушённый. У игр с очень большим составом значки не читаются, и
   * вместо них встаёт счётчик.
   */
  const seats = computed(() => {
    if (game.maxPlayers > GAME_SEATS_MAX_ICONS) {
      return [];
    }

    return Array.from({ length: game.maxPlayers }, (_, index) => {
      if (index < game.approvedSeats) {
        return { index, icon: 'tabler:user-filled', tone: 'text-primary' };
      }

      // Заявка подана, но мастер её ещё не разобрал: место занято, однако
      // состав по нему не окончателен.
      if (index < game.takenSeats) {
        return { index, icon: 'tabler:user', tone: 'text-primary' };
      }

      // Приглушение задаётся прозрачностью, а не отдельным цветом: тона
      // темы стоят слишком близко и в тёмном оформлении меняются местами.
      return {
        index,
        icon: 'tabler:user',
        tone:
          index < game.playersToStart ? 'text-muted' : 'text-muted opacity-40',
      };
    });
  });

  const seatsHint = computed(() => getGameSeatsHint(game));

  const seatsCounter = computed(() => getGameSeatsCounter(game));

  const { open: openProfile } = useMasterProfileDrawer();

  /** Открывает профиль мастера этой игры. */
  function openMasterProfile(): void {
    openProfile(game.masterId, masterName);
  }
</script>

<!--
  Все карточки каталога одной высоты, и высота не зависит от содержимого:
  обложка держит пропорции, заголовок занимает две строки, значкам отведены
  ровно две строки, а мастер и места — по одной. Иначе сетка расходится по
  рядам и каталог выглядит рваным.
-->
<template>
  <UCard
    class="h-full transition-shadow hover:shadow-md"
    :ui="{ body: 'flex h-full flex-col gap-3 p-4' }"
  >
    <!--
      Обложка ведёт на страницу игры. Для клавиатуры и скринридеров эта
      ссылка скрыта: она дублирует ссылку-заголовок ниже, и без скрытия
      каждая карточка требовала бы двух табов до одной и той же цели.
    -->
    <ULink
      :to="gameRoute"
      tabindex="-1"
      aria-hidden="true"
      class="group relative block overflow-hidden rounded-md"
    >
      <GameCover
        :image-url="game.imageUrl"
        :alt="game.title"
        :game-type="game.type"
        class="transition-opacity group-hover:opacity-90"
      />

      <!-- Платность — поверх обложки: это первое, что ищут в карточке. -->
      <UBadge
        class="absolute top-2 right-2"
        size="sm"
        variant="solid"
        :color="isFree ? 'success' : 'warning'"
        :icon="isFree ? undefined : 'tabler:coins'"
        :label="GAME_COST_TYPE_LABELS[game.costType]"
      />
    </ULink>

    <ULink
      :to="gameRoute"
      :title="game.title"
      class="line-clamp-2 h-12 text-lg leading-6 font-semibold text-highlighted hover:text-primary"
    >
      {{ game.title }}
    </ULink>

    <!--
      Описание в карточку не выносится: оно бывает длинным и разной высоты, и
      даже обрезанное растягивало бы карточки по-разному, ломая ровную сетку
      каталога. Полный текст — на странице игры.
    -->
    <div class="flex h-12 flex-wrap items-start gap-1.5 overflow-hidden">
      <UBadge
        v-for="badge in badges"
        :key="badge.key"
        :color="badge.color"
        variant="subtle"
        size="sm"
        :label="badge.label"
      />
    </div>

    <div class="mt-auto flex flex-col gap-1">
      <span class="flex h-5 items-baseline gap-1 text-sm leading-5">
        <span class="font-semibold text-toned">{{ GAME_MASTER_LABEL }}:</span>

        <!-- Имя ведёт в профиль мастера, а не в игру: карточка целиком и так
          открывает объявление -->
        <ULink
          as="button"
          type="button"
          class="line-clamp-1 text-left text-primary"
          :title="MASTER_PROFILE_OPEN_HINT"
          @click.left.exact.prevent.stop="openMasterProfile"
        >
          {{ masterName }}
        </ULink>
      </span>

      <!-- Значки сами по себе ничего не говорят вслух, поэтому расшифровка
        занятости идёт и подсказкой, и `aria-label` -->
      <UTooltip :text="seatsHint">
        <div
          class="flex h-5 w-fit items-center gap-1"
          :aria-label="seatsHint"
        >
          <template v-if="seats.length">
            <UIcon
              v-for="seat in seats"
              :key="seat.index"
              :name="seat.icon"
              class="size-4"
              :class="seat.tone"
            />
          </template>

          <!-- Большой состав значками не читается, но пустой ряд мест не
            говорит ничего: набрана группа или нет — видно по счётчику -->
          <template v-else>
            <UIcon
              name="tabler:users"
              class="size-4 text-muted"
            />

            <span class="text-sm leading-5 text-muted tabular-nums">
              {{ seatsCounter }}
            </span>
          </template>
        </div>
      </UTooltip>
    </div>
  </UCard>
</template>
