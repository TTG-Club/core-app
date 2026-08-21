<script setup lang="ts">
  import type { SpellCatalogItem } from '../../model';

  import {
    getSpellGroupLabel,
    SHEET_FEAT_SPELLS_LABELS,
    SHEET_SEARCH_LABELS,
  } from '../../model';
  import SheetSearchInput from './SheetSearchInput.vue';

  /** Строка списка: заклинание пула с состоянием выбора. */
  interface SpellRow extends SpellCatalogItem {
    selected: boolean;
    disabled: boolean;
    rowClass: string;
    icon: string;
    iconClass: string;
  }

  /** Заклинания одного круга: список разбит на группы, как раздел сайта. */
  interface SpellGroup {
    level: number;
    title: string;
    spells: SpellRow[];
  }

  const props = defineProps<{
    /** Подпись выбора черты: она же заголовок окна. */
    title: string;

    /** Пул заклинаний: он уже сужен классом и кругом из механики черты. */
    items: SpellCatalogItem[];

    /** Названия заклинаний, выбранных ранее. */
    selected: string[];

    /** Сколько заклинаний просит черта; 0 — без предела. */
    count: number;
  }>();

  const emit = defineEmits<{
    /** Закрытие окна; выбранные заклинания передаются только при добавлении. */
    close: [spells?: string[]];
  }>();

  // Окно правит копию: список выбранных заклинаний до нажатия «Добавить»
  // меняться не должен — игрок может передумать и закрыть окно.
  const draft = ref<string[]>([...props.selected]);

  const searchTerm = ref('');

  const isLimitReached = computed(
    () => props.count > 0 && draft.value.length >= props.count,
  );

  const countLabel = computed(() =>
    props.count > 0
      ? `${SHEET_FEAT_SPELLS_LABELS.chosen}: ${draft.value.length} из ${props.count}`
      : `${SHEET_FEAT_SPELLS_LABELS.chosen}: ${draft.value.length}`,
  );

  /** Осталось добрать столько-то: подсказка под счётчиком. */
  const restLabel = computed(() => {
    if (!props.count) {
      return '';
    }

    const rest = props.count - draft.value.length;

    return rest > 0
      ? `${SHEET_FEAT_SPELLS_LABELS.rest}: ${rest}`
      : SHEET_FEAT_SPELLS_LABELS.enough;
  });

  const filteredSpells = computed<SpellCatalogItem[]>(() => {
    const query = searchTerm.value.trim().toLowerCase();

    if (!query) {
      return props.items;
    }

    return withLayoutFallback(query, (searchQuery) =>
      props.items.filter((spell) =>
        spell.name.toLowerCase().includes(searchQuery),
      ),
    );
  });

  // Группировка по кругу: пул черты бывает и на сотню заклинаний, а «Заговоры»
  // и «1 круг» отдельными пачками читаются так же, как в разделе сайта.
  const groups = computed<SpellGroup[]>(() => {
    const byLevel = new Map<number, SpellRow[]>();

    for (const spell of filteredSpells.value) {
      const selected = draft.value.includes(spell.name);

      const disabled = !selected && isLimitReached.value;

      const row: SpellRow = {
        ...spell,
        selected,
        disabled,
        rowClass: disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-elevated/60',
        icon: selected ? 'tabler:square-check' : 'tabler:square',
        iconClass: selected ? 'text-primary' : 'text-dimmed',
      };

      byLevel.set(spell.level, [...(byLevel.get(spell.level) ?? []), row]);
    }

    return [...byLevel.entries()]
      .map(([level, spells]) => ({
        level,
        title: getSpellGroupLabel(level),
        spells: spells.sort((left, right) =>
          left.name.localeCompare(right.name, 'ru'),
        ),
      }))
      .sort((left, right) => left.level - right.level);
  });

  const isEmpty = computed(() => filteredSpells.value.length === 0);

  /**
   * Переключает заклинание в черновике.
   *
   * @param spell строка списка.
   */
  function toggleSpell(spell: SpellRow) {
    if (spell.disabled) {
      return;
    }

    draft.value = spell.selected
      ? draft.value.filter((name) => name !== spell.name)
      : [...draft.value, spell.name];
  }

  function handleApply() {
    emit('close', draft.value);
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <div class="flex h-[60dvh] min-h-80 flex-col gap-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-highlighted">
            {{ countLabel }}
          </span>

          <span
            v-if="restLabel"
            class="text-xs text-dimmed"
          >
            {{ restLabel }}
          </span>
        </div>

        <SheetSearchInput
          v-model="searchTerm"
          :placeholder="SHEET_SEARCH_LABELS.byNamePlaceholder"
          class="shrink-0"
        />

        <div
          v-if="isEmpty"
          class="flex grow items-center justify-center text-sm text-dimmed"
        >
          {{ SHEET_FEAT_SPELLS_LABELS.empty }}
        </div>

        <div
          v-else
          class="flex min-h-0 grow flex-col gap-3 overflow-y-auto pr-1"
        >
          <div
            v-for="group in groups"
            :key="group.level"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center gap-2">
              <span
                class="shrink-0 text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ group.title }}
              </span>

              <div class="h-px grow bg-default/50" />
            </div>

            <button
              v-for="spell in group.spells"
              :key="spell.url"
              type="button"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors"
              :class="spell.rowClass"
              :disabled="spell.disabled"
              :aria-pressed="spell.selected"
              @click.left.exact.prevent="toggleSpell(spell)"
            >
              <UIcon
                :name="spell.icon"
                class="size-5 shrink-0"
                :class="spell.iconClass"
              />

              <span class="min-w-0 grow truncate text-sm text-highlighted">
                {{ spell.name }}
              </span>

              <UBadge
                size="sm"
                color="neutral"
                variant="subtle"
                class="shrink-0"
              >
                {{ spell.school }}
              </UBadge>
            </button>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_FEAT_SPELLS_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="SHEET_FEAT_SPELLS_LABELS.apply"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
