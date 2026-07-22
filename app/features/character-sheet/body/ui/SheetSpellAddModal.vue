<script setup lang="ts">
  import type { FilterGroups } from '~infrastructure/filter';

  import type { CharacterSpell, SpellCatalogItem } from '../../model';

  import { FilterDrawer } from '~infrastructure/filter';
  import { SpellDrawer } from '~spells/drawer';

  import { useCharacterSheet, useSpellCatalogSearch } from '../../composables';
  import {
    getSpellGroupLabel,
    SPELL_CATALOG_LOAD_MORE_DISTANCE,
    SPELL_LEVELS,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const overlay = useOverlay();

  const { character, setSpells } = useCharacterSheet();

  // Дровер описания заклинания; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const spellPreviewDrawer = overlay.create(SpellDrawer, {
    props: {
      url: '',
      onClose: () => spellPreviewDrawer.close(),
    },
  });

  function handlePreview(url: string) {
    spellPreviewDrawer.open({ url });
  }

  // Каталог грузится постранично с сервера (как раздел «Заклинания»):
  // фильтры и поиск уходят в query, следующая страница — по скроллу.
  const {
    searchTerm,
    selectedLevels,
    selectedClassIds,
    onlyConcentration,
    onlyRitual,
    hasActiveFilters,
    classOptions,
    filterGroups,
    spells,
    isLoadingFirstPage,
    isLoadingMore,
    hasLoadError,
    hasNextPage,
    toggleLevel,
    toggleClassId,
    toggleConcentration,
    toggleRitual,
    applyFilterGroups,
    resetFilterSelections,
    resetFilters,
    loadNextPage,
    retryLoad,
  } = useSpellCatalogSearch();

  // Дровер «Все фильтры» — переиспользованный FilterDrawer раздела; работает
  // с тем же состоянием фильтра, что и быстрые чипы.
  const isFilterDrawerOpened = ref(false);

  function openFilterDrawer() {
    isFilterDrawerOpened.value = true;
  }

  function handleFilterDrawerSave(groups: FilterGroups) {
    applyFilterGroups(groups);
    isFilterDrawerOpened.value = false;
  }

  function handleFilterDrawerReset() {
    resetFilterSelections();
    isFilterDrawerOpened.value = false;
  }

  const spellListContainer = useTemplateRef<HTMLElement>('spellListContainer');

  useInfiniteScroll(spellListContainer, loadNextPage, {
    distance: SPELL_CATALOG_LOAD_MORE_DISTANCE,
    canLoadMore: () =>
      hasNextPage.value
      && !isLoadingFirstPage.value
      && !isLoadingMore.value
      && !hasLoadError.value,
  });

  /** Черновик книги: выбранные заклинания по URL. */
  const draftSpells = ref(
    new Map<string, CharacterSpell>(
      character.value.spells.map((spell) => [spell.url, { ...spell }]),
    ),
  );

  const selectedCountLabel = computed(
    () => `Выбрано: ${draftSpells.value.size}`,
  );

  function toggleSpell(spell: SpellCatalogItem) {
    if (draftSpells.value.has(spell.url)) {
      draftSpells.value.delete(spell.url);

      return;
    }

    draftSpells.value.set(spell.url, {
      url: spell.url,
      name: spell.name,
      level: spell.level,
      school: spell.school,
      concentration: spell.concentration,
      ritual: spell.ritual,
    });
  }

  const CHIP_BASE_CLASS =
    'cursor-pointer rounded border px-2 py-1 text-xs transition-colors';

  const CHIP_IDLE_CLASS = 'border-default text-toned hover:border-warning/60';

  const CHIP_SELECTED_CLASS = 'border-warning bg-warning/10 text-warning';

  function getChipClass(isSelected: boolean): string {
    return `${CHIP_BASE_CLASS} ${isSelected ? CHIP_SELECTED_CLASS : CHIP_IDLE_CLASS}`;
  }

  const displayLevels = computed(() =>
    SPELL_LEVELS.map((level) => ({
      level,
      isSelected: selectedLevels.value.has(level),
      chipClass: getChipClass(selectedLevels.value.has(level)),
    })),
  );

  const displayProperties = computed(() => [
    {
      key: 'concentration',
      label: 'Концентрация',
      chipClass: getChipClass(onlyConcentration.value),
      toggle: toggleConcentration,
    },
    {
      key: 'ritual',
      label: 'Ритуал',
      chipClass: getChipClass(onlyRitual.value),
      toggle: toggleRitual,
    },
  ]);

  const displayClasses = computed(() =>
    [...classOptions.value]
      .sort((left, right) => left.name.localeCompare(right.name, 'ru'))
      .map((classOption) => ({
        id: classOption.id,
        name: classOption.name,
        chipClass: getChipClass(selectedClassIds.value.has(classOption.id)),
      })),
  );

  interface SpellCatalogGroup {
    level: number;
    label: string;
    spells: Array<SpellCatalogItem & { isSelected: boolean; rowClass: string }>;
  }

  // Сервер отдаёт заклинания в порядке групп кругов (grouping=LEVEL),
  // поэтому пересортировка не нужна; Map сливает заклинания одного круга
  // из соседних страниц в единственную группу.
  const displayGroups = computed(() => {
    const groupsByLevel = new Map<number, SpellCatalogGroup>();

    for (const spell of spells.value) {
      const isSelected = draftSpells.value.has(spell.url);

      const row = {
        ...spell,
        isSelected,
        rowClass: isSelected ? 'bg-elevated' : '',
      };

      const existingGroup = groupsByLevel.get(spell.level);

      if (existingGroup) {
        existingGroup.spells.push(row);
      } else {
        groupsByLevel.set(spell.level, {
          level: spell.level,
          label: getSpellGroupLabel(spell.level),
          spells: [row],
        });
      }
    }

    return [...groupsByLevel.values()];
  });

  function handleApply() {
    setSpells([...draftSpells.value.values()]);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    title="Добавление заклинаний"
    :ui="{ content: 'sm:max-w-4xl' }"
  >
    <template #body>
      <!-- Высота ряда фиксирована от вьюпорта, чтобы список тянулся до низа
        модалки независимо от высоты сайдбара фильтров. -->
      <div class="flex h-[65dvh] min-h-96 gap-4">
        <aside class="flex w-44 shrink-0 flex-col gap-4 overflow-y-auto">
          <UInput
            v-model="searchTerm"
            icon="tabler:search"
            size="sm"
            placeholder="Поиск…"
            class="shrink-0"
          />

          <div class="flex shrink-0 items-center gap-1">
            <UButton
              icon="tabler:filter"
              label="Все фильтры"
              color="neutral"
              variant="subtle"
              size="sm"
              block
              class="min-w-0 grow"
              :disabled="!filterGroups.length"
              @click.left.exact.prevent="openFilterDrawer"
            />

            <UTooltip
              v-if="hasActiveFilters"
              text="Сбросить фильтры"
            >
              <UButton
                icon="tabler:filter-off"
                color="neutral"
                variant="ghost"
                size="sm"
                square
                aria-label="Сбросить фильтры"
                @click.left.exact.prevent="resetFilters"
              />
            </UTooltip>
          </div>

          <div class="flex flex-col gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Круг
            </span>

            <div class="flex flex-wrap gap-1">
              <button
                v-for="levelChip in displayLevels"
                :key="levelChip.level"
                type="button"
                class="min-w-7 text-center"
                :class="levelChip.chipClass"
                :aria-pressed="levelChip.isSelected"
                :aria-label="`Круг ${levelChip.level}`"
                @click.left.exact.prevent="toggleLevel(levelChip.level)"
              >
                {{ levelChip.level }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Свойства
            </span>

            <div class="flex flex-col gap-1">
              <button
                v-for="property in displayProperties"
                :key="property.key"
                type="button"
                class="text-left"
                :class="property.chipClass"
                @click.left.exact.prevent="property.toggle"
              >
                {{ property.label }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Класс
            </span>

            <div class="flex flex-col gap-1">
              <button
                v-for="classChip in displayClasses"
                :key="classChip.id"
                type="button"
                class="truncate text-left"
                :class="classChip.chipClass"
                @click.left.exact.prevent="toggleClassId(classChip.id)"
              >
                {{ classChip.name }}
              </button>
            </div>
          </div>
        </aside>

        <div class="flex min-w-0 grow flex-col">
          <div
            ref="spellListContainer"
            class="flex min-h-0 grow flex-col gap-3 overflow-y-auto pr-1"
          >
            <div
              v-if="isLoadingFirstPage"
              class="flex grow items-center justify-center py-10"
            >
              <UIcon
                name="tabler:loader-2"
                class="size-6 animate-spin text-muted"
              />
            </div>

            <template v-else>
              <div
                v-for="group in displayGroups"
                :key="group.level"
                class="flex flex-col gap-1"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="shrink-0 text-[10px] font-bold tracking-wider text-muted uppercase"
                  >
                    {{ group.label }}
                  </span>

                  <div class="h-px grow bg-default/50" />
                </div>

                <div
                  v-for="spell in group.spells"
                  :key="spell.url"
                  class="relative flex items-center gap-2 rounded-md pr-2 transition-colors hover:bg-elevated/60"
                  :class="spell.rowClass"
                >
                  <button
                    type="button"
                    class="flex min-w-0 grow cursor-pointer items-center gap-2 px-3 py-1.5 text-left after:absolute after:inset-0 after:cursor-pointer"
                    :aria-label="`Выбрать заклинание: ${spell.name}`"
                    @click.left.exact.prevent="toggleSpell(spell)"
                  >
                    <span class="truncate text-sm font-medium text-highlighted">
                      {{ spell.name }}
                    </span>

                    <span
                      v-if="spell.school"
                      class="shrink-0 text-xs text-muted"
                    >
                      {{ spell.school }}
                    </span>
                  </button>

                  <UTooltip
                    v-if="spell.concentration"
                    text="Концентрация"
                  >
                    <UBadge
                      size="sm"
                      color="warning"
                      variant="subtle"
                      class="relative z-10 shrink-0"
                    >
                      К
                    </UBadge>
                  </UTooltip>

                  <UTooltip
                    v-if="spell.ritual"
                    text="Ритуал"
                  >
                    <UBadge
                      size="sm"
                      color="info"
                      variant="subtle"
                      class="relative z-10 shrink-0"
                    >
                      Р
                    </UBadge>
                  </UTooltip>

                  <UTooltip text="Открыть описание заклинания">
                    <UButton
                      icon="tabler:layout-sidebar-right-expand"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      square
                      class="relative z-10 shrink-0"
                      :aria-label="`Описание заклинания: ${spell.name}`"
                      @click.left.exact.prevent="handlePreview(spell.url)"
                    />
                  </UTooltip>

                  <UIcon
                    v-if="spell.isSelected"
                    name="tabler:check"
                    class="size-4 shrink-0 text-warning"
                  />
                </div>
              </div>

              <span
                v-if="!displayGroups.length && !hasLoadError"
                class="px-3 py-6 text-center text-sm text-dimmed"
              >
                Ничего не найдено
              </span>

              <div
                v-if="hasLoadError"
                class="flex flex-col items-center gap-2 py-4"
              >
                <span class="text-sm text-dimmed">
                  Не удалось загрузить заклинания
                </span>

                <UButton
                  label="Повторить"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  @click.left.exact.prevent="retryLoad"
                />
              </div>

              <div
                v-else-if="isLoadingMore"
                class="flex justify-center py-3"
              >
                <UIcon
                  name="tabler:loader-2"
                  class="size-5 animate-spin text-muted"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Слайсовер телепортируется в body; внутри #body он держит у модалки
        единственный корень, чтобы open/after:leave от useOverlay доходили
        до UModal. -->
      <FilterDrawer
        v-if="filterGroups.length"
        v-model="isFilterDrawerOpened"
        title="Фильтры заклинаний"
        :groups="filterGroups"
        @save="handleFilterDrawerSave"
        @reset="handleFilterDrawerReset"
      />
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <span class="text-sm text-muted">{{ selectedCountLabel }}</span>

        <div class="flex gap-2">
          <UButton
            label="Отмена"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            label="Применить"
            color="primary"
            @click.left.exact.prevent="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
