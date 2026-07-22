<script setup lang="ts">
  import type { CharacterSpell, SpellCatalogItem } from '../../model';

  import { SpellDrawer } from '~spells/drawer';

  import { useCharacterSheet } from '../../composables';
  import {
    getSpellGroupLabel,
    parseSpellCatalog,
    SPELL_CATALOG_MAX_PAGES,
    SPELL_CATALOG_PAGE_SIZE,
    SPELL_LEVELS,
    SPELLS_SEARCH_PATH,
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

  // Каталог загружается постранично до конца (с предохранителем от
  // бесконечной пагинации) и кешируется по ключу на сессию.
  const { data: catalog, status: catalogStatus } = await useAsyncData(
    'character-sheet:spell-catalog',
    async () => {
      const allSpells: SpellCatalogItem[] = [];

      for (let page = 0; page < SPELL_CATALOG_MAX_PAGES; page += 1) {
        const response = await $fetch<unknown>(SPELLS_SEARCH_PATH, {
          method: 'GET',
          query: {
            page,
            size: SPELL_CATALOG_PAGE_SIZE,
            grouping: 'NONE',
          },
          retry: 0,
        });

        const batch = parseSpellCatalog(response);

        allSpells.push(...batch);

        if (batch.length < SPELL_CATALOG_PAGE_SIZE) {
          break;
        }
      }

      return allSpells;
    },
    { server: false },
  );

  const isCatalogLoading = computed(() => catalogStatus.value === 'pending');

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
    });
  }

  // Быстрые фильтры.
  const searchTerm = ref('');

  const selectedLevels = ref(new Set<number>());

  const selectedClasses = ref(new Set<string>());

  const onlyConcentration = ref(false);

  const onlyRitual = ref(false);

  const CHIP_BASE_CLASS =
    'cursor-pointer rounded border px-2 py-1 text-xs transition-colors';

  const CHIP_IDLE_CLASS = 'border-default text-toned hover:border-warning/60';

  const CHIP_SELECTED_CLASS = 'border-warning bg-warning/10 text-warning';

  function getChipClass(isSelected: boolean): string {
    return `${CHIP_BASE_CLASS} ${isSelected ? CHIP_SELECTED_CLASS : CHIP_IDLE_CLASS}`;
  }

  function toggleLevel(level: number) {
    if (selectedLevels.value.has(level)) {
      selectedLevels.value.delete(level);
    } else {
      selectedLevels.value.add(level);
    }
  }

  function toggleClass(className: string) {
    if (selectedClasses.value.has(className)) {
      selectedClasses.value.delete(className);
    } else {
      selectedClasses.value.add(className);
    }
  }

  function toggleConcentration() {
    onlyConcentration.value = !onlyConcentration.value;
  }

  function toggleRitual() {
    onlyRitual.value = !onlyRitual.value;
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

  const displayClasses = computed(() => {
    const uniqueClasses = new Set<string>();

    for (const spell of catalog.value ?? []) {
      for (const className of spell.classes) {
        uniqueClasses.add(className);
      }
    }

    return [...uniqueClasses]
      .sort((left, right) => left.localeCompare(right, 'ru'))
      .map((className) => ({
        name: className,
        chipClass: getChipClass(selectedClasses.value.has(className)),
      }));
  });

  const hasActiveFilters = computed(
    () =>
      Boolean(searchTerm.value.trim())
      || selectedLevels.value.size > 0
      || selectedClasses.value.size > 0
      || onlyConcentration.value
      || onlyRitual.value,
  );

  function resetFilters() {
    searchTerm.value = '';
    selectedLevels.value = new Set<number>();
    selectedClasses.value = new Set<string>();
    onlyConcentration.value = false;
    onlyRitual.value = false;
  }

  const filteredSpells = computed(() => {
    const query = searchTerm.value.trim().toLowerCase();

    // Запрос в неверной раскладке («ашкуифдд» → «fireball») тоже находит.
    const layoutQuery = convertKeyboardLayout(query);

    const queries = layoutQuery === query ? [query] : [query, layoutQuery];

    return (catalog.value ?? []).filter((spell) => {
      if (query) {
        const name = spell.name.toLowerCase();

        const nameEng = spell.nameEng.toLowerCase();

        const matchesSearch = queries.some(
          (candidate) =>
            name.includes(candidate) || nameEng.includes(candidate),
        );

        if (!matchesSearch) {
          return false;
        }
      }

      if (selectedLevels.value.size && !selectedLevels.value.has(spell.level)) {
        return false;
      }

      if (onlyConcentration.value && !spell.concentration) {
        return false;
      }

      if (onlyRitual.value && !spell.ritual) {
        return false;
      }

      if (
        selectedClasses.value.size
        && !spell.classes.some((className) =>
          selectedClasses.value.has(className),
        )
      ) {
        return false;
      }

      return true;
    });
  });

  const displayGroups = computed(() => {
    const sortedSpells = [...filteredSpells.value].sort(
      (left, right) =>
        left.level - right.level || left.name.localeCompare(right.name, 'ru'),
    );

    const groups: Array<{
      level: number;
      label: string;
      spells: Array<
        SpellCatalogItem & { isSelected: boolean; rowClass: string }
      >;
    }> = [];

    for (const spell of sortedSpells) {
      const isSelected = draftSpells.value.has(spell.url);

      const row = {
        ...spell,
        isSelected,
        rowClass: isSelected ? 'bg-elevated' : '',
      };

      const lastGroup = groups.at(-1);

      if (!lastGroup || lastGroup.level !== spell.level) {
        groups.push({
          level: spell.level,
          label: getSpellGroupLabel(spell.level),
          spells: [row],
        });
      } else {
        lastGroup.spells.push(row);
      }
    }

    return groups;
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
      <div class="flex min-h-96 gap-4">
        <aside class="flex w-44 shrink-0 flex-col gap-4">
          <div class="flex items-center gap-1">
            <UInput
              v-model="searchTerm"
              icon="tabler:search"
              size="sm"
              placeholder="Поиск…"
              class="min-w-0 grow"
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
                :key="classChip.name"
                type="button"
                class="truncate text-left"
                :class="classChip.chipClass"
                @click.left.exact.prevent="toggleClass(classChip.name)"
              >
                {{ classChip.name }}
              </button>
            </div>
          </div>
        </aside>

        <div class="flex min-w-0 grow flex-col">
          <div
            v-if="isCatalogLoading"
            class="flex grow items-center justify-center py-10"
          >
            <UIcon
              name="tabler:loader-2"
              class="size-6 animate-spin text-muted"
            />
          </div>

          <div
            v-else
            class="flex max-h-128 flex-col gap-3 overflow-y-auto pr-1"
          >
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
              v-if="!displayGroups.length"
              class="px-3 py-6 text-center text-sm text-dimmed"
            >
              Ничего не найдено
            </span>
          </div>
        </div>
      </div>
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
