<script setup lang="ts">
  import type { SpellCatalogItem } from '../../model';

  import { getSpellLevelLabel, SHEET_FEAT_SPELLS_LABELS } from '../../model';
  import SheetFeatSpellsModal from './SheetFeatSpellsModal.vue';

  /** Строка выбранного заклинания: подпись круга рядом с названием. */
  interface ChosenSpell {
    name: string;
    levelLabel: string;
  }

  const {
    count = 0,
    items,
    label,
  } = defineProps<{
    /** Подпись выбора: она же заголовок окна со списком. */
    label: string;

    /** Пул заклинаний: он уже сужен классом и кругом из механики черты. */
    items: SpellCatalogItem[];

    /** Сколько заклинаний просит черта; 0 — без предела. */
    count?: number;
  }>();

  const model = defineModel<string[]>({ default: () => [] });

  const overlay = useOverlay();

  // Без destroyOnClose: закрытая модалка остаётся в оверлее, и повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const spellsModal = overlay.create(SheetFeatSpellsModal);

  const chosenSpells = computed<ChosenSpell[]>(() =>
    model.value.map((name) => ({
      name,
      levelLabel: getSpellLevelLabel(
        items.find((spell) => spell.name === name)?.level ?? 0,
      ),
    })),
  );

  const countLabel = computed(() =>
    count > 0
      ? `${SHEET_FEAT_SPELLS_LABELS.chosen}: ${model.value.length} из ${count}`
      : `${SHEET_FEAT_SPELLS_LABELS.chosen}: ${model.value.length}`,
  );

  /** Пул ещё не загрузился — выбирать не из чего, и окно открывать незачем. */
  const isAddDisabled = computed(() => items.length === 0);

  /**
   * Открывает окно со списком заклинаний. Закрытие без «Добавить» ничего не
   * меняет: окно правит копию выбранного.
   */
  async function handleAdd() {
    const chosen = await spellsModal.open({
      title: label,
      items,
      selected: model.value,
      count,
    }).result;

    if (!chosen) {
      return;
    }

    model.value = chosen;
  }

  /**
   * Убирает заклинание из выбранных: добрать его можно тем же окном.
   *
   * @param name название заклинания.
   */
  function handleRemove(name: string) {
    model.value = model.value.filter((spell) => spell !== name);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs text-dimmed">{{ countLabel }}</span>

      <UButton
        icon="tabler:plus"
        size="xs"
        color="primary"
        variant="soft"
        :label="SHEET_FEAT_SPELLS_LABELS.add"
        :disabled="isAddDisabled"
        @click.left.exact.prevent="handleAdd"
      />
    </div>

    <p
      v-if="!chosenSpells.length"
      class="rounded-lg border border-dashed border-default p-3 text-center text-xs text-dimmed italic"
    >
      {{ SHEET_FEAT_SPELLS_LABELS.none }}
    </p>

    <div
      v-else
      class="flex flex-col gap-1"
    >
      <div
        v-for="spell in chosenSpells"
        :key="spell.name"
        class="flex items-center gap-2 rounded-md border border-default/60 bg-elevated/30 px-2 py-1.5"
      >
        <span class="min-w-0 grow truncate text-sm text-highlighted">
          {{ spell.name }}
        </span>

        <UBadge
          size="sm"
          color="neutral"
          variant="subtle"
          class="shrink-0"
        >
          {{ spell.levelLabel }}
        </UBadge>

        <UButton
          icon="tabler:x"
          size="xs"
          color="error"
          variant="ghost"
          :aria-label="SHEET_FEAT_SPELLS_LABELS.remove"
          @click.left.exact.prevent="handleRemove(spell.name)"
        />
      </div>
    </div>
  </div>
</template>
