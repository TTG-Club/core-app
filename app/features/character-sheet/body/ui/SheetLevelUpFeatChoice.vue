<script setup lang="ts">
  import type { AbilityKey, FeatSelectOption } from '../../model';

  import { FeatDrawer } from '~feats/drawer';

  import {
    ABILITY_IMPROVEMENT_LABELS,
    ABILITY_LABELS,
    ABILITY_ORDER,
    getAbilityIncreaseHeadroom,
    SHEET_FEAT_PICK_LABELS,
  } from '../../model';
  import SheetFeatPickModal from './SheetFeatPickModal.vue';

  const {
    title = ABILITY_IMPROVEMENT_LABELS.featTitle,
    options,
    selected = null,
    abilities,
    scores,
    isLoading = false,
    hasError = false,
  } = defineProps<{
    /** Подпись выбора из записи умения; пусто — общая «Выберите черту». */
    title?: string;

    /** Черты, доступные для выбора (уже отфильтрованы мастером). */
    options: FeatSelectOption[];

    /** Выбранная черта; null — выбора ещё не было. */
    selected?: FeatSelectOption | null;

    /** Выбранные характеристики по слотам прибавок (null — слот пуст). */
    abilities: (AbilityKey | null)[];

    /** Текущие значения характеристик персонажа (для подсказки о пределе). */
    scores: Record<AbilityKey, number>;

    isLoading?: boolean;

    /** Каталог черт загрузить не удалось — выбор недоступен. */
    hasError?: boolean;
  }>();

  const emit = defineEmits<{
    'update:feat': [featUrl: string];
    'update:ability': [payload: { slot: number; ability: AbilityKey | null }];
  }>();

  const overlay = useOverlay();

  // Дровер описания черты с сайта; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const featPreviewDrawer = overlay.create(FeatDrawer, {
    props: {
      url: '',
      onClose: () => featPreviewDrawer.close(),
    },
  });

  // Черту выбирают окном со списком: пул бывает под сотню записей, и описание
  // каждой читают прямо оттуда — тем же порядком, что заклинания черты.
  // Без destroyOnClose: закрытая модалка остаётся в оверлее, и повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const featPickModal = overlay.create(SheetFeatPickModal);

  const selectedUrl = computed(() => selected?.url ?? '');

  const isPreviewVisible = computed(() => selectedUrl.value !== '');

  const chosenLabel = computed(
    () => selected?.name || SHEET_FEAT_PICK_LABELS.notChosen,
  );

  const chosenClass = computed(() =>
    selected ? 'text-highlighted' : 'text-dimmed italic',
  );

  const chooseLabel = computed(() =>
    selected ? SHEET_FEAT_PICK_LABELS.change : SHEET_FEAT_PICK_LABELS.choose,
  );

  /** Пул ещё не загрузился — выбирать не из чего, и окно открывать незачем. */
  const isChooseDisabled = computed(() => options.length === 0);

  /**
   * Слоты прибавок выбранной черты: у каждого свой список характеристик,
   * ограниченный чертой. Уже упёршиеся в предел характеристики остаются
   * видимыми, но недоступны — иначе выбор молча пропал бы при применении.
   */
  const abilitySlots = computed(() => {
    const allowed = selected?.abilities ?? [];

    const allowedKeys = allowed.length > 0 ? allowed : ABILITY_ORDER;

    return abilities.map((value, slot) => ({
      slot,
      // Незаполненный слот — undefined, а не пустая строка: значения селекта
      // типизированы ключами характеристик, и placeholder показывает именно оно.
      value: value ?? undefined,
      items: allowedKeys.map((key) => ({
        label: ABILITY_LABELS[key],
        value: key,
        disabled: getAbilityIncreaseHeadroom(scores[key]) === 0,
      })),
    }));
  });

  const isAbilitiesVisible = computed(() => abilitySlots.value.length > 0);

  function handlePreview() {
    if (selectedUrl.value) {
      featPreviewDrawer.open({ url: selectedUrl.value });
    }
  }

  /**
   * Открывает окно выбора черты. Закрытие без подтверждения ничего не меняет:
   * окно правит копию выбора.
   */
  async function handleChoose() {
    const chosen = await featPickModal.open({
      title: title || ABILITY_IMPROVEMENT_LABELS.featTitle,
      items: options,
      selected: selectedUrl.value,
    }).result;

    if (chosen === undefined) {
      return;
    }

    emit('update:feat', chosen);
  }

  function handleAbility(slot: number, value: unknown) {
    const ability = ABILITY_ORDER.find((key) => key === value) ?? null;

    emit('update:ability', { slot, ability });
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs text-muted">
      {{ title || ABILITY_IMPROVEMENT_LABELS.featTitle }}
    </span>

    <span
      v-if="hasError"
      class="text-xs text-primary"
    >
      {{ ABILITY_IMPROVEMENT_LABELS.loadError }}
    </span>

    <div
      v-else
      class="flex items-center gap-2"
    >
      <div
        class="flex min-w-0 grow items-center gap-2 rounded-md border border-default/60 bg-elevated/30 px-2 py-1.5"
      >
        <span
          class="min-w-0 grow truncate text-sm"
          :class="chosenClass"
        >
          {{ chosenLabel }}
        </span>

        <UBadge
          v-if="selected?.sourceLabel"
          size="sm"
          color="neutral"
          variant="subtle"
          class="shrink-0"
        >
          {{ selected.sourceLabel }}
        </UBadge>

        <UTooltip
          v-if="isPreviewVisible"
          :text="ABILITY_IMPROVEMENT_LABELS.previewTooltip"
        >
          <UButton
            icon="tabler:layout-sidebar-right-expand"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="shrink-0"
            :aria-label="ABILITY_IMPROVEMENT_LABELS.previewAriaLabel"
            @click.left.exact.prevent="handlePreview"
          />
        </UTooltip>
      </div>

      <UButton
        icon="tabler:list-search"
        color="primary"
        variant="soft"
        size="sm"
        class="shrink-0"
        :label="chooseLabel"
        :loading="isLoading"
        :disabled="isChooseDisabled"
        @click.left.exact.prevent="handleChoose"
      />
    </div>

    <template v-if="isAbilitiesVisible">
      <span class="text-xs text-muted">
        {{ ABILITY_IMPROVEMENT_LABELS.abilitiesTitle }}
      </span>

      <div class="flex flex-wrap gap-2">
        <USelect
          v-for="slot in abilitySlots"
          :key="slot.slot"
          :model-value="slot.value"
          :items="slot.items"
          :placeholder="ABILITY_IMPROVEMENT_LABELS.abilityPlaceholder"
          class="min-w-40 grow"
          @update:model-value="handleAbility(slot.slot, $event)"
        />
      </div>

      <span class="text-xs text-dimmed">
        {{ ABILITY_IMPROVEMENT_LABELS.maxHint }}
      </span>
    </template>
  </div>
</template>
