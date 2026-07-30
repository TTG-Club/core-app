<script setup lang="ts">
  import type { AbilityKey, FeatSelectOption } from '../../model';

  import { FeatDrawer } from '~feats/drawer';

  import {
    ABILITY_IMPROVEMENT_LABELS,
    ABILITY_LABELS,
    ABILITY_ORDER,
    getAbilityIncreaseHeadroom,
  } from '../../model';

  const {
    options,
    selected = null,
    abilities,
    scores,
    isLoading = false,
    hasError = false,
  } = defineProps<{
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

  const featItems = computed(() =>
    options.map((option) => ({
      label: option.name,
      value: option.url,
      description: option.sourceLabel,
    })),
  );

  const selectedUrl = computed(() => selected?.url ?? '');

  const isPreviewVisible = computed(() => selectedUrl.value !== '');

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

  function handleFeat(value: unknown) {
    emit('update:feat', typeof value === 'string' ? value : '');
  }

  function handleAbility(slot: number, value: unknown) {
    const ability = ABILITY_ORDER.find((key) => key === value) ?? null;

    emit('update:ability', { slot, ability });
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs text-muted">
      {{ ABILITY_IMPROVEMENT_LABELS.featTitle }}
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
      <USelectMenu
        :model-value="selectedUrl"
        :items="featItems"
        :loading="isLoading"
        :placeholder="ABILITY_IMPROVEMENT_LABELS.featPlaceholder"
        label-key="label"
        value-key="value"
        searchable
        class="min-w-0 grow"
        @update:model-value="handleFeat"
      />

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
