<script setup lang="ts">
  import type { Game } from '../../model';

  import { useMyGamesOverview } from '../../composables';
  import {
    CATALOG_RETRY_LABEL,
    GAME_NEXT_SESSION_FALLBACK,
    getAttentionReason,
    getFindGameErrorMessage,
    getGameRoute,
    MY_GAMES_AGENDA_DAY_FORMAT,
    MY_GAMES_AGENDA_MONTH_FORMAT,
    MY_GAMES_AGENDA_TIME_FORMAT,
    MY_GAMES_ATTENTION_EMPTY,
    MY_GAMES_ATTENTION_LABEL,
    MY_GAMES_ERROR_TITLE,
    MY_GAMES_OVERVIEW_SIZE,
    MY_GAMES_UPCOMING_EMPTY,
    MY_GAMES_UPCOMING_LABEL,
  } from '../../model';

  type OverviewSectionKey = 'upcoming' | 'attention';

  /** Строка сводки: игра, подпись под ней и плашка слева. */
  interface OverviewEntry {
    id: string;
    title: string;
    route: string;
    caption: string;
    /** Число и месяц встречи; без даты вместо них в плашке значок раздела. */
    day: string | null;
    month: string | null;
  }

  interface OverviewSection {
    key: OverviewSectionKey;
    title: string;
    icon: string;
    emptyLabel: string;
    /** Сколько всего игр в разделе — в списке видны только первые. */
    totalLabel: string;
    entries: Array<OverviewEntry>;
    /** Тон плашки: встречи — акцентом, внимание — предупреждением. */
    tileClass: string;
    /** Раздел раскрыт на узком экране; на широком раскрыты все. */
    isOpen: boolean;
  }

  const {
    upcomingGames,
    upcomingTotal,
    attentionGames,
    attentionTotal,
    error,
    status,
    isLoading,
    refresh,
  } = useMyGamesOverview();

  const { user } = useUser();
  const { format } = useDayjs();

  /**
   * Строка ближайшей встречи. Дата вынесена в плашку, чтобы список читался
   * как ежедневник; под названием остаются день недели и время.
   * @param game Игра с ближайшей встречей.
   */
  function toUpcomingEntry(game: Game): OverviewEntry {
    const startsAt = game.nextSession?.startsAt;

    return {
      id: game.id,
      title: game.title,
      route: getGameRoute(game.id),
      caption: startsAt
        ? format(startsAt, MY_GAMES_AGENDA_TIME_FORMAT)
        : GAME_NEXT_SESSION_FALLBACK,
      day: startsAt ? format(startsAt, MY_GAMES_AGENDA_DAY_FORMAT) : null,
      month: startsAt ? format(startsAt, MY_GAMES_AGENDA_MONTH_FORMAT) : null,
    };
  }

  const { greaterOrEqual } = useBreakpoints();
  const isMounted = useMounted();
  const isLargeScreen = greaterOrEqual(Breakpoint.LG);

  /**
   * На широком экране сводка стоит колонкой справа и раскрыта всегда. На
   * узком она встаёт над списком игр, и раскрытые разделы увели бы список за
   * первый экран, поэтому там они свёрнуты до заголовков со счётчиками.
   */
  const isColumn = computed(() => isMounted.value && isLargeScreen.value);

  const openSectionKeys = ref<Array<OverviewSectionKey>>([]);

  const sections = computed<Array<OverviewSection>>(() => [
    {
      key: 'upcoming',
      title: MY_GAMES_UPCOMING_LABEL,
      icon: 'tabler:calendar-event',
      emptyLabel: MY_GAMES_UPCOMING_EMPTY,
      totalLabel: String(upcomingTotal.value),
      entries: upcomingGames.value.map(toUpcomingEntry),
      tileClass: 'bg-primary/10 text-primary',
      isOpen: openSectionKeys.value.includes('upcoming'),
    },
    {
      key: 'attention',
      title: MY_GAMES_ATTENTION_LABEL,
      icon: 'tabler:alert-circle',
      emptyLabel: MY_GAMES_ATTENTION_EMPTY,
      totalLabel: String(attentionTotal.value),
      entries: attentionGames.value.map((game) => ({
        id: game.id,
        title: game.title,
        route: getGameRoute(game.id),
        caption: getAttentionReason(game, user.value?.id ?? null),
        day: null,
        month: null,
      })),
      tileClass: 'bg-warning/10 text-warning',
      isOpen: openSectionKeys.value.includes('attention'),
    },
  ]);

  /**
   * Раскрывает или сворачивает раздел на узком экране.
   * @param key Раздел сводки.
   * @param open Новое состояние.
   */
  function handleSectionToggle(key: OverviewSectionKey, open: boolean): void {
    const otherKeys = openSectionKeys.value.filter(
      (sectionKey) => sectionKey !== key,
    );

    openSectionKeys.value = open ? [...otherKeys, key] : otherKeys;
  }

  const [DefineEntries, ReuseEntries] = createReusableTemplate<{
    section: OverviewSection;
  }>();
</script>

<template>
  <DefineEntries v-slot="{ section }">
    <div class="px-2 pb-2">
      <div
        v-if="isLoading"
        class="flex flex-col gap-1"
      >
        <USkeleton
          v-for="index in MY_GAMES_OVERVIEW_SIZE"
          :key="index"
          class="h-15 w-full rounded-lg"
        />
      </div>

      <p
        v-else-if="!section.entries.length"
        class="px-2 pb-2 text-sm text-muted"
      >
        {{ section.emptyLabel }}
      </p>

      <ul
        v-else
        class="flex flex-col"
      >
        <li
          v-for="entry in section.entries"
          :key="entry.id"
        >
          <ULink
            :to="entry.route"
            raw
            class="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-hover"
          >
            <span
              class="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg"
              :class="section.tileClass"
            >
              <template v-if="entry.day">
                <span class="text-base/none font-semibold tabular-nums">
                  {{ entry.day }}
                </span>

                <span class="text-xs/tight">{{ entry.month }}</span>
              </template>

              <UIcon
                v-else
                :name="section.icon"
                class="size-5"
              />
            </span>

            <span class="flex min-w-0 flex-col">
              <span
                class="truncate font-medium text-highlighted transition-colors group-hover:text-primary"
              >
                {{ entry.title }}
              </span>

              <span class="truncate text-sm text-muted">
                {{ entry.caption }}
              </span>
            </span>
          </ULink>
        </li>
      </ul>
    </div>
  </DefineEntries>

  <UAlert
    v-if="status === 'error'"
    color="error"
    variant="subtle"
    :title="MY_GAMES_ERROR_TITLE"
    :description="getFindGameErrorMessage(error)"
  >
    <template #actions>
      <UButton
        size="sm"
        :label="CATALOG_RETRY_LABEL"
        @click.left.exact.prevent="refresh()"
      />
    </template>
  </UAlert>

  <div
    v-else
    class="flex flex-col gap-4"
  >
    <template v-if="isColumn">
      <section
        v-for="section in sections"
        :key="section.key"
        class="rounded-xl border border-default bg-elevated"
      >
        <h2 class="flex items-center gap-2 px-4 pt-3 pb-2">
          <UIcon
            :name="section.icon"
            class="size-5 shrink-0 text-muted"
          />

          <span class="font-semibold text-highlighted">
            {{ section.title }}
          </span>

          <UBadge
            v-if="!isLoading"
            color="neutral"
            variant="subtle"
            size="sm"
            :label="section.totalLabel"
          />
        </h2>

        <ReuseEntries :section="section" />
      </section>
    </template>

    <template v-else>
      <UCollapsible
        v-for="section in sections"
        :key="section.key"
        :open="section.isOpen"
        class="group rounded-xl border border-default bg-elevated"
        @update:open="handleSectionToggle(section.key, $event)"
      >
        <UButton
          color="neutral"
          variant="ghost"
          block
          :icon="section.icon"
          trailing-icon="tabler:chevron-down"
          :ui="{
            base: 'px-4 py-3',
            label: 'flex flex-auto items-center gap-2 text-left',
            trailingIcon:
              'transition-transform group-data-[state=open]:rotate-180',
          }"
        >
          <span class="font-semibold text-highlighted">
            {{ section.title }}
          </span>

          <UBadge
            v-if="!isLoading"
            color="neutral"
            variant="subtle"
            size="sm"
            :label="section.totalLabel"
          />
        </UButton>

        <template #content>
          <ReuseEntries :section="section" />
        </template>
      </UCollapsible>
    </template>
  </div>
</template>
