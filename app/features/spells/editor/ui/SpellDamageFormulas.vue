<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';

  import type { SpellDamageFormulaPart } from '../../model';

  import {
    createEmptySpellDamageFormulaPart,
    SPELL_DAMAGE_PART_LABELS,
  } from '../../model';
  import SpellDamageFormulaRow from './SpellDamageFormulaRow.vue';

  const { damageTypeOptions, damageTypesPending = false } = defineProps<{
    /** Типы урона справочника — грузит редактор боя, один раз на вкладку. */
    damageTypeOptions: Array<SelectOption>;
    /** Справочник ещё грузится. */
    damageTypesPending?: boolean;
  }>();

  /**
   * Части урона правятся напрямую, без промежуточного списка строк: заклинание
   * может обходиться вовсе без урона, поэтому пустая часть — обычное состояние
   * формы, а не то, что надо прятать от модели. Незаполненные части отбрасывает
   * `normalizeSpellEffect` при сохранении.
   */
  const model = defineModel<Array<SpellDamageFormulaPart>>({ required: true });

  function addPart() {
    model.value = [...model.value, createEmptySpellDamageFormulaPart()];
  }

  function removePart(partIndex: number) {
    model.value = model.value.filter((_, position) => position !== partIndex);
  }

  function updatePart(partIndex: number, part: SpellDamageFormulaPart) {
    model.value = model.value.map((current, position) =>
      position === partIndex ? part : current,
    );
  }
</script>

<template>
  <div class="col-span-full flex flex-col gap-3">
    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ SPELL_DAMAGE_PART_LABELS.empty }}
    </p>

    <SpellDamageFormulaRow
      v-for="(part, partIndex) in model"
      :key="partIndex"
      :model-value="part"
      :index="partIndex"
      :damage-type-options="damageTypeOptions"
      :damage-types-pending="damageTypesPending"
      @update:model-value="updatePart(partIndex, $event)"
      @remove="removePart(partIndex)"
    />

    <UButton
      icon="tabler:plus"
      size="sm"
      variant="soft"
      class="self-start"
      @click.left.exact.prevent="addPart"
    >
      {{ SPELL_DAMAGE_PART_LABELS.addPart }}
    </UButton>
  </div>
</template>
