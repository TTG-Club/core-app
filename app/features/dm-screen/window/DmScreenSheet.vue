<script setup lang="ts">
  import type { ScreenSheetCard, ScreenSheetLocation } from '../model';

  import {
    fetchCharacterSheet,
    fetchSharedCharacterSheet,
  } from '~character-sheet/model';
  import { UiResult } from '~ui/result';

  import {
    DM_SCREEN_ICONS,
    DM_SCREEN_SHEET_KEY,
    DM_SCREEN_SHEET_PROFICIENCY_CLASS,
    DM_SCREEN_SHEET_REFRESH_INTERVAL,
    DM_SCREEN_SKELETON_LINES,
    DM_SCREEN_TEXT,
    toScreenSheetCard,
  } from '../model';

  /**
   * Лист персонажа в окне ширмы: карточка с тем, что мастеру нужно за
   * столом, — хиты, КД, инициатива, скорость, характеристики со
   * спасбросками и навыки. Только для чтения: сам лист открывается кнопкой
   * в шапке окна. Свой лист грузится по идентификатору, чужой — по ссылке
   * владельца.
   *
   * Игроки меняют листы во время игры, поэтому карточка сама перечитывает
   * лист раз в полминуты, пока вкладка на виду, и по кнопке «Обновить».
   */
  const { sheet } = defineProps<{
    /**
     * Чей лист и чем он открывается; при смене листа компонент создаётся
     * заново, поэтому ключ и запрос постоянны.
     */
    sheet: ScreenSheetLocation;
  }>();

  const emit = defineEmits<{
    /** Лист загрузился: имя персонажа для шапки окна. */
    loaded: [title: string];
  }>();

  const {
    data: card,
    status,
    refresh,
  } = useAsyncData<ScreenSheetCard>(
    `${DM_SCREEN_SHEET_KEY}-${sheet.source}-${sheet.key}`,
    async () => {
      const detail =
        sheet.source === 'shared'
          ? await fetchSharedCharacterSheet(sheet.key)
          : await fetchCharacterSheet(sheet.key);

      return toScreenSheetCard(detail.data);
    },
    { server: false, dedupe: 'defer' },
  );

  // Пока лист перечитывается, прежняя карточка остаётся на месте: ошибкой
  // считается только лист, который не удалось показать вовсе
  const isFailed = computed(() => status.value === 'error' && !card.value);

  const isRefreshing = computed(
    () => status.value === 'pending' && Boolean(card.value),
  );

  /** Перечитывает лист. */
  function reload(): void {
    void refresh();
  }

  const visibility = useDocumentVisibility();

  // На спрятанной вкладке листы не перечитываются: смотреть на них некому
  useIntervalFn(() => {
    if (visibility.value === 'visible') {
      reload();
    }
  }, DM_SCREEN_SHEET_REFRESH_INTERVAL);

  watchImmediate(card, (loadedCard) => {
    if (loadedCard) {
      emit('loaded', loadedCard.name);
    }
  });

  const abilityViews = computed(() =>
    (card.value?.abilities ?? []).map((ability) => ({
      ...ability,
      savingThrowClass: ability.isSavingThrowProficient
        ? DM_SCREEN_SHEET_PROFICIENCY_CLASS.proficient
        : DM_SCREEN_SHEET_PROFICIENCY_CLASS.plain,
    })),
  );

  const skillViews = computed(() =>
    (card.value?.skills ?? []).map((skill) => ({
      ...skill,
      modifierClass: skill.isProficient
        ? DM_SCREEN_SHEET_PROFICIENCY_CLASS.proficient
        : DM_SCREEN_SHEET_PROFICIENCY_CLASS.plain,
    })),
  );
</script>

<template>
  <UiResult
    v-if="isFailed"
    :title="DM_SCREEN_TEXT.sheetFailed"
    :sub-title="DM_SCREEN_TEXT.sheetFailedDescription"
    status="error"
  />

  <div
    v-else-if="card"
    class="flex flex-col gap-4"
  >
    <div class="flex items-center gap-3">
      <UAvatar
        :src="card.avatarUrl"
        :alt="card.name"
        :icon="DM_SCREEN_ICONS.sheetAvatar"
        size="3xl"
        class="rounded-lg"
      />

      <div class="flex min-w-0 flex-auto flex-col">
        <span class="truncate text-lg text-highlighted">
          {{ card.name }}
        </span>

        <span class="truncate text-sm text-muted">
          {{ card.subtitle }}
        </span>
      </div>

      <UTooltip :text="DM_SCREEN_TEXT.sheetRefresh">
        <UButton
          :icon="DM_SCREEN_ICONS.refresh"
          :aria-label="DM_SCREEN_TEXT.sheetRefresh"
          :loading="isRefreshing"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="reload"
        />
      </UTooltip>
    </div>

    <div
      class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-default bg-elevated/50 px-3 py-2"
    >
      <UIcon
        :name="DM_SCREEN_ICONS.sheetHitPoints"
        class="size-5 shrink-0 text-error"
      />

      <span class="text-sm text-muted">
        {{ DM_SCREEN_TEXT.sheetHitPoints }}
      </span>

      <span class="text-lg text-highlighted tabular-nums">
        {{ card.hitPoints }}
      </span>

      <UBadge
        v-if="card.temporaryHitPoints"
        :label="card.temporaryHitPoints"
        color="info"
        variant="subtle"
        size="sm"
      />

      <UBadge
        v-if="card.exhaustion"
        :label="card.exhaustion"
        color="warning"
        variant="subtle"
        size="sm"
      />
    </div>

    <dl class="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
      <div
        v-for="stat in card.stats"
        :key="stat.key"
        class="flex items-center gap-2 rounded-lg border border-default px-3 py-2"
      >
        <UIcon
          :name="stat.icon"
          class="size-5 shrink-0 text-primary"
        />

        <div class="flex min-w-0 flex-col">
          <dt class="text-xs leading-tight text-muted">
            {{ stat.label }}
          </dt>

          <dd class="text-highlighted tabular-nums">
            {{ stat.value }}
          </dd>
        </div>
      </div>
    </dl>

    <section class="flex flex-col gap-2">
      <h3 class="text-sm text-muted">
        {{ DM_SCREEN_TEXT.sheetAbilities }}
      </h3>

      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="ability in abilityViews"
          :key="ability.key"
          class="flex flex-col items-center rounded-lg border border-default px-2 py-1.5"
        >
          <span class="text-xs text-muted">
            {{ ability.label }}
          </span>

          <span class="text-lg text-highlighted tabular-nums">
            {{ ability.modifier }}
          </span>

          <span class="text-xs text-muted tabular-nums">
            {{ ability.score }}
          </span>

          <span
            class="text-xs tabular-nums"
            :class="ability.savingThrowClass"
          >
            {{ DM_SCREEN_TEXT.sheetSavingThrow }} {{ ability.savingThrow }}
          </span>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <h3 class="text-sm text-muted">
        {{ DM_SCREEN_TEXT.sheetSkills }}
      </h3>

      <ul
        class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-4 gap-y-1"
      >
        <li
          v-for="skill in skillViews"
          :key="skill.name"
          class="flex items-baseline justify-between gap-2 text-sm"
        >
          <span class="truncate">
            {{ skill.name }}
          </span>

          <span
            class="shrink-0 tabular-nums"
            :class="skill.modifierClass"
          >
            {{ skill.modifier }}
          </span>
        </li>
      </ul>
    </section>
  </div>

  <div
    v-else
    class="flex flex-col gap-2"
  >
    <USkeleton class="h-14 w-2/3" />

    <USkeleton
      v-for="line in DM_SCREEN_SKELETON_LINES"
      :key="line"
      class="h-4 w-full"
    />
  </div>
</template>
