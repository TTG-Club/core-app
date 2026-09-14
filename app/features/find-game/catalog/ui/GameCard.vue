<script setup lang="ts">
  import type { Game } from '../../model';

  import { useGameSystems, useMasterProfileDrawer } from '../../composables';
  import {
    GAME_COST_TYPE_ICONS,
    GAME_COST_TYPE_LABELS,
    GAME_COVER_BADGE_CLASS,
    GAME_COVER_COST_ICON_CLASS,
    GAME_COVER_STATUS_DOT_CLASSES,
    GAME_MASTER_LABEL,
    GAME_NEXT_SESSION_EMPTY,
    GAME_NEXT_SESSION_SHORT_DATE_FORMAT,
    GAME_NEXT_SESSION_SHORT_LABEL,
    GAME_SEATS_LABEL,
    GAME_SEATS_MAX_ICONS,
    GAME_STATUS_COLORS,
    GAME_STATUS_LABELS,
    GAME_TYPE_ICONS,
    GAME_VISIBILITY_LABELS,
    getGameFormatSummary,
    getGameRoute,
    getGameSeatsCounter,
    getGameSeatsHint,
    getGenresLabel,
    MASTER_PROFILE_OPEN_HINT,
    SESSION_REGISTRATION_STATUS_COLORS,
    SESSION_REGISTRATION_STATUS_LABELS,
  } from '../../model';
  import { GameCover, GameFavoriteButton } from '../../ui';

  /**
   * Значок состояния в «Моих играх»: состояние игры, своя заявка или
   * видимость. Видимость показывается одним замком — подпись уходит в
   * подсказку, чтобы столбик на обложке оставался узким.
   */
  interface StatusBadge {
    key: string;
    /** Видимая подпись; у значка-замка её нет. */
    label?: string;
    /** Подсказка и `aria-label` для значка без подписи. */
    hint?: string;
    /** Цвет точки состояния; у замка точки нет. */
    dotClass?: string;
    icon?: string;
  }

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

  /**
   * Монета — только у платной игры, и выделена золотом; бесплатная обходится
   * подписью.
   */
  const costBadgeIcon = computed(() => GAME_COST_TYPE_ICONS[game.costType]);

  const costLabel = computed(() => GAME_COST_TYPE_LABELS[game.costType]);

  /**
   * Состояние игры — столбиком в углу обложки напротив формата. В каталоге
   * этих значков нет вовсе, а в «Моих играх» они важнее всего остального: там
   * им место на самом заметном участке карточки, а не в общем ряду условий.
   */
  const statusBadges = computed<Array<StatusBadge>>(() => {
    if (!showStatus) {
      return [];
    }

    const items: Array<StatusBadge> = [
      {
        key: 'status',
        label: GAME_STATUS_LABELS[game.status],
        dotClass:
          GAME_COVER_STATUS_DOT_CLASSES[GAME_STATUS_COLORS[game.status]],
      },
    ];

    // Своя заявка: в «Моих играх» игрок ищет в карточке в первую очередь то,
    // разобрал её мастер или нет.
    if (game.myRegistrationStatus) {
      const registrationColor =
        SESSION_REGISTRATION_STATUS_COLORS[game.myRegistrationStatus];

      items.push({
        key: 'registration',
        label: SESSION_REGISTRATION_STATUS_LABELS[game.myRegistrationStatus],
        dotClass: GAME_COVER_STATUS_DOT_CLASSES[registrationColor],
      });
    }

    if (game.visibility === 'PRIVATE') {
      items.push({
        key: 'visibility',
        hint: GAME_VISIBILITY_LABELS.PRIVATE,
        icon: 'tabler:lock',
      });
    }

    return items;
  });

  const { format } = useDayjs();

  /**
   * Дата ближайшей встречи. Своей даты у игры нет — время назначается
   * встречам, поэтому в карточке стоит ближайшая из них. Пока расписания нет,
   * подпись говорит об этом прямо: пустая строка читалась бы потерянными
   * данными.
   */
  const nextSessionLabel = computed(() => {
    const startsAt = game.nextSession?.startsAt;

    return startsAt
      ? format(startsAt, GAME_NEXT_SESSION_SHORT_DATE_FORMAT)
      : GAME_NEXT_SESSION_EMPTY;
  });

  /** Назначенная дата выделена, неназначенная приглушена. */
  const nextSessionClass = computed(() =>
    game.nextSession?.startsAt ? 'text-toned' : 'text-muted',
  );

  /** Значок формата: он ведёт строку условий по нижнему краю обложки. */
  const formatIcon = computed(() => GAME_TYPE_ICONS[game.type]);

  const formatSummary = computed(() => getGameFormatSummary(game));
  const genresLabel = computed(() => getGenresLabel(game.genres));

  const { getSystemName } = useGameSystems();
  const systemLabel = computed(() => getSystemName(game.system));

  /**
   * Места в ближайшей сессии, по одному значку на место. Три состояния
   * различаются видом: подтверждённое мастером место — залитый цветной
   * значок, место с неразобранной заявкой — цветной контурный, свободное до
   * минимума для старта — контурный, свободное сверх минимума — контурный
   * приглушённый. У игр с очень большим составом значки не читаются, и
   * остаётся один счётчик.
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
  обложка держит пропорции, заголовок занимает две строки, условиям игры
  отведена одна строка, а подвал с мастером и местами прижат к низу. Иначе
  сетка расходится по рядам и каталог выглядит рваным.

  Условия разложены по слоям, а не свалены в один ряд значков: стоимость — в
  углу обложки напротив звёздочки, формат с длительностью — по её нижнему
  краю, состояние в «Моих играх» — столбиком напротив формата, система с
  жанром — над названием. Так в карточку помещается всё сразу, без обрезания
  значков, а тело карточки одинаково в каталоге и в «Моих играх».
-->
<template>
  <article
    class="group relative isolate flex h-full flex-col overflow-hidden rounded-xl border border-default bg-elevated shadow-sm transition-all duration-200 hover:border-primary hover:shadow-lg"
  >
    <!--
      Открывает объявление кликом по любому месту карточки. Для клавиатуры и
      скринридеров эта ссылка скрыта: она дублирует ссылку-заголовок ниже, и
      без скрытия каждая карточка требовала бы двух табов до одной цели.
      Собственные ссылки подвала подняты над ней слоем. Слои замкнуты в
      карточке `isolate`: иначе они перекрывали бы плавающие элементы
      страницы, например мобильную плашку действий.
    -->
    <ULink
      :to="gameRoute"
      :title="game.title"
      tabindex="-1"
      aria-hidden="true"
      class="absolute inset-0 z-10"
    />

    <div class="relative overflow-hidden">
      <GameCover
        :image-url="game.imageUrl"
        :alt="game.title"
        :game-type="game.type"
        class="transition-transform duration-300 group-hover:scale-105"
      />

      <!-- Затемнение снизу: под ним белая строка условий читается и на
        картинке, и на заглушке без картинки -->
      <div
        class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-black/5"
      />

      <!-- Платность — первое, что ищут в карточке, поэтому она в углу обложки
        напротив звёздочки -->

      <div
        class="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-2"
      >
        <UBadge
          size="md"
          color="neutral"
          variant="solid"
          :class="GAME_COVER_BADGE_CLASS"
          :icon="costBadgeIcon"
          :label="costLabel"
          :ui="{ leadingIcon: GAME_COVER_COST_ICON_CLASS }"
        />

        <!-- Панель уже поднята над ссылкой карточки; звёздочка только
          возвращает себе нажатия внутри неинтерактивного слоя. -->
        <GameFavoriteButton
          class="pointer-events-auto ml-auto"
          :game-id="game.id"
          on-cover
        />
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-2.5"
      >
        <div
          class="flex min-w-0 items-center gap-1.5 text-xs font-medium text-white"
        >
          <UIcon
            :name="formatIcon"
            class="size-4 shrink-0"
          />

          <span class="truncate [text-shadow:0_1px_3px_#000000a6]">
            {{ formatSummary }}
          </span>
        </div>

        <!--
          Состояние игры в «Моих играх» — столбиком в правом нижнем углу,
          напротив строки формата; цвет состояния несёт точка. Столбик поднят
          над ссылкой карточки ради подсказки у замка и занимает ровно ширину
          значков, чтобы остальная обложка по-прежнему открывала игру.
        -->
        <div
          v-if="statusBadges.length"
          class="pointer-events-auto relative z-20 flex shrink-0 flex-col items-end gap-1"
        >
          <UTooltip
            v-for="badge in statusBadges"
            :key="badge.key"
            :text="badge.hint"
            :disabled="!badge.hint"
          >
            <UBadge
              :class="GAME_COVER_BADGE_CLASS"
              size="md"
              color="neutral"
              variant="solid"
              :icon="badge.icon"
              :label="badge.label"
              :aria-label="badge.hint"
            >
              <template
                v-if="badge.dotClass"
                #leading
              >
                <span
                  class="size-2 shrink-0 rounded-full"
                  :class="badge.dotClass"
                />
              </template>
            </UBadge>
          </UTooltip>
        </div>
      </div>
    </div>

    <!--
      Описание в карточку не выносится: оно бывает длинным и разной высоты, и
      даже обрезанное растягивало бы карточки по-разному, ломая ровную сетку
      каталога. Полный текст — на странице игры.
    -->
    <div class="flex flex-auto flex-col gap-3 p-4">
      <!-- Система с жанром — над названием, как рубрика над заголовком -->
      <div class="flex h-6 items-center gap-2">
        <UBadge
          class="shrink-0"
          color="primary"
          variant="subtle"
          size="md"
          :label="systemLabel"
        />

        <span
          v-if="genresLabel"
          class="truncate text-sm text-muted"
          :title="genresLabel"
        >
          {{ genresLabel }}
        </span>
      </div>

      <!-- Высота заголовка не резервируется под вторую строку: у короткого
        названия она осталась бы дырой между ним и подвалом. Ровный низ
        карточек держит прижатый подвал, и свободное место собирается над его
        разделителем, где читается как поле, а не как провал -->
      <h3 class="line-clamp-2 text-lg leading-6 font-semibold">
        <ULink
          :to="gameRoute"
          class="text-highlighted transition-colors group-hover:text-primary"
        >
          {{ game.title }}
        </ULink>
      </h3>

      <div
        class="mt-auto flex flex-col gap-1.5 border-t border-default pt-3 text-sm"
      >
        <div class="flex items-center gap-1.5">
          <UIcon
            name="tabler:calendar-event"
            class="size-4 shrink-0 text-muted"
          />

          <span class="shrink-0 text-muted"
            >{{ GAME_NEXT_SESSION_SHORT_LABEL }}:</span
          >

          <span
            class="truncate font-medium"
            :class="nextSessionClass"
          >
            {{ nextSessionLabel }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <UIcon
            name="tabler:crown"
            class="size-4 shrink-0 text-muted"
          />

          <span class="shrink-0 text-muted">{{ GAME_MASTER_LABEL }}:</span>

          <!-- Имя ведёт в профиль мастера, а не в игру: карточка целиком и так
            открывает объявление. Ссылка поднята над подложкой карточки, иначе
            клик по имени открывал бы игру -->
          <ULink
            as="button"
            type="button"
            class="relative z-20 truncate text-left font-medium text-primary"
            :title="MASTER_PROFILE_OPEN_HINT"
            @click.left.exact.prevent.stop="openMasterProfile"
          >
            {{ masterName }}
          </ULink>
        </div>

        <!-- Значки сами по себе ничего не говорят вслух, поэтому расшифровка
          занятости идёт и подсказкой, и `aria-label`. Счётчик стоит рядом со
          значками: он же остаётся единственным у игр с большим составом -->
        <UTooltip :text="seatsHint">
          <div
            class="relative z-20 flex w-fit items-center gap-2"
            :aria-label="seatsHint"
          >
            <span class="shrink-0 text-muted">{{ GAME_SEATS_LABEL }}:</span>

            <div
              v-if="seats.length"
              class="flex items-center gap-0.5"
            >
              <UIcon
                v-for="seat in seats"
                :key="seat.index"
                :name="seat.icon"
                class="size-4"
                :class="seat.tone"
              />
            </div>

            <span class="text-muted tabular-nums">{{ seatsCounter }}</span>
          </div>
        </UTooltip>
      </div>
    </div>
  </article>
</template>
