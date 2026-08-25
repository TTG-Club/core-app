<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';

  import type { SpellCantripScalingTier, SpellScaling } from '../../model';

  import {
    createEmptyDamageFormulaPart,
    DamagePartRow,
  } from '~ui/damage-formula';

  import {
    createEmptySpellCantripScalingTier,
    createEmptySpellScaling,
    SPELL_SCALING_LABELS,
  } from '../../model';

  const {
    level,
    damageTypeOptions,
    damageTypesPending = false,
  } = defineProps<{
    /** Круг заклинания: у заговора масштабирование поуровневое, а не за круг. */
    level: number;
    /** Типы урона справочника — для частей урона тира. */
    damageTypeOptions: Array<SelectOption>;
    /** Справочник ещё грузится. */
    damageTypesPending?: boolean;
  }>();

  const scaling = defineModel<SpellScaling | undefined>('scaling');

  const tiers = defineModel<Array<SpellCantripScalingTier>>('tiers', {
    default: () => [],
  });

  const isCantrip = computed(() => level === 0);

  const title = computed(() =>
    isCantrip.value
      ? SPELL_SCALING_LABELS.cantripTitle
      : SPELL_SCALING_LABELS.title,
  );

  const hint = computed(() =>
    isCantrip.value
      ? SPELL_SCALING_LABELS.cantripHint
      : SPELL_SCALING_LABELS.hint,
  );

  /**
   * Галочка «Усиление на высших кругах» — своё состояние формы, а не вывод из
   * данных: иначе только что поставленная галочка снималась бы сама, пока поля
   * пустые. Загруженная запись включает её через watcher ниже.
   */
  const hasScaling = ref(false);

  watch(
    scaling,
    (value) => {
      // Цикл не заводится: watcher только включает галочку, а снятие её ниже
      // чистит поля и второй раз включить уже не может.
      if (value?.additionalDice || value?.description) {
        hasScaling.value = true;
      }
    },
    { immediate: true },
  );

  /**
   * Обновляет одно поле усиления, заводя блок, если его ещё нет.
   *
   * @param changes изменённые поля усиления.
   */
  function patchScaling(changes: Partial<SpellScaling>) {
    scaling.value = {
      ...(scaling.value ?? createEmptySpellScaling()),
      ...changes,
    };
  }

  // Число доп. целей живёт в блоке целей и от галочки не зависит: снятие
  // галочки убирает только кости и описание.
  function disableScaling() {
    if (!scaling.value) {
      return;
    }

    patchScaling({ additionalDice: undefined, description: undefined });
  }

  watch(hasScaling, (enabled) => {
    if (!enabled) {
      disableScaling();
    }
  });

  const additionalDice = computed({
    get: () => scaling.value?.additionalDice ?? '',
    set: (value) => {
      patchScaling({ additionalDice: value });
    },
  });

  const description = computed({
    get: () => scaling.value?.description ?? '',
    set: (value) => {
      patchScaling({ description: value });
    },
  });

  function addTier() {
    tiers.value = [...tiers.value, createEmptySpellCantripScalingTier()];
  }

  function removeTier(tierIndex: number) {
    tiers.value = tiers.value.filter((_, position) => position !== tierIndex);
  }

  function updateTier(tierIndex: number, tier: SpellCantripScalingTier) {
    tiers.value = tiers.value.map((current, position) =>
      position === tierIndex ? tier : current,
    );
  }

  function updateTierLevel(tierIndex: number, tierLevel: number | undefined) {
    const tier = tiers.value[tierIndex];

    if (tier) {
      updateTier(tierIndex, { ...tier, level: tierLevel });
    }
  }

  function updateTierPart(
    tierIndex: number,
    partIndex: number,
    part: SpellCantripScalingTier['parts'][number],
  ) {
    const tier = tiers.value[tierIndex];

    if (!tier) {
      return;
    }

    updateTier(tierIndex, {
      ...tier,
      parts: tier.parts.map((current, position) =>
        position === partIndex ? part : current,
      ),
    });
  }

  function addTierPart(tierIndex: number) {
    const tier = tiers.value[tierIndex];

    if (!tier) {
      return;
    }

    updateTier(tierIndex, {
      ...tier,
      parts: [...tier.parts, createEmptyDamageFormulaPart()],
    });
  }

  function removeTierPart(tierIndex: number, partIndex: number) {
    const tier = tiers.value[tierIndex];

    if (!tier) {
      return;
    }

    updateTier(tierIndex, {
      ...tier,
      parts: tier.parts.filter((_, position) => position !== partIndex),
    });
  }
</script>

<template>
  <div
    class="col-span-full flex flex-col gap-3 rounded-lg border border-default bg-elevated/20 p-3"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 flex-col">
        <span class="text-sm font-medium">{{ title }}</span>

        <span class="text-xs text-muted">{{ hint }}</span>
      </div>

      <UCheckbox
        v-if="!isCantrip"
        v-model="hasScaling"
        :label="SPELL_SCALING_LABELS.enable"
      />
    </div>

    <!-- Уровневое заклинание: прибавка за каждый круг выше -->
    <template v-if="!isCantrip">
      <p
        v-if="!hasScaling"
        class="text-xs text-dimmed italic"
      >
        {{ SPELL_SCALING_LABELS.fallbackHint }}
      </p>

      <div
        v-else
        class="grid grid-cols-24 gap-3"
      >
        <UFormField
          class="col-span-full md:col-span-8"
          :label="SPELL_SCALING_LABELS.additionalDice"
          name="effect.scaling.additionalDice"
        >
          <UInput
            v-model="additionalDice"
            class="font-mono"
            :placeholder="SPELL_SCALING_LABELS.additionalDicePlaceholder"
          />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-16"
          :label="SPELL_SCALING_LABELS.description"
          name="effect.scaling.description"
        >
          <UInput
            v-model="description"
            :placeholder="SPELL_SCALING_LABELS.descriptionPlaceholder"
          />
        </UFormField>
      </div>
    </template>

    <!-- Заговор: поуровневые тиры, каждый заменяет набор частей целиком -->
    <template v-else>
      <p class="text-xs text-dimmed italic">
        {{ SPELL_SCALING_LABELS.cantripTiersHint }}
      </p>

      <div
        v-for="(tier, tierIndex) in tiers"
        :key="tierIndex"
        class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/20 p-3"
      >
        <div class="flex items-end justify-between gap-3">
          <UFormField
            class="flex-1"
            :label="SPELL_SCALING_LABELS.tierLevel"
            :name="`effect.cantripScalingTiers.${tierIndex}.level`"
          >
            <UInputNumber
              :model-value="tier.level"
              :min="1"
              :max="20"
              :placeholder="SPELL_SCALING_LABELS.tierLevelPlaceholder"
              @update:model-value="updateTierLevel(tierIndex, $event)"
            />
          </UFormField>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="soft"
            size="sm"
            :aria-label="SPELL_SCALING_LABELS.tierRemove"
            @click.left.exact.prevent="removeTier(tierIndex)"
          />
        </div>

        <p
          v-if="!tier.parts.length"
          class="rounded-lg border border-dashed border-default p-3 text-center text-xs text-dimmed italic"
        >
          {{ SPELL_SCALING_LABELS.tierPartsEmpty }}
        </p>

        <DamagePartRow
          v-for="(part, partIndex) in tier.parts"
          :key="partIndex"
          :model-value="part"
          :index="partIndex"
          :damage-type-options="damageTypeOptions"
          :damage-types-pending="damageTypesPending"
          :field-name-prefix="`effect.cantripScalingTiers.${tierIndex}.parts`"
          @update:model-value="updateTierPart(tierIndex, partIndex, $event)"
          @remove="removeTierPart(tierIndex, partIndex)"
        />

        <UButton
          icon="tabler:plus"
          size="xs"
          variant="soft"
          class="self-start"
          @click.left.exact.prevent="addTierPart(tierIndex)"
        >
          {{ SPELL_SCALING_LABELS.tierPartAdd }}
        </UButton>
      </div>

      <UButton
        icon="tabler:plus"
        size="xs"
        variant="subtle"
        class="self-start"
        @click.left.exact.prevent="addTier"
      >
        {{ SPELL_SCALING_LABELS.tierAdd }}
      </UButton>
    </template>
  </div>
</template>
