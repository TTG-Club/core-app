<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';

  import type { DamageFormulaPart } from './part';

  import { DAMAGE_PART_LABELS } from './constants';
  import DamagePartRow from './DamagePartRow.vue';
  import { createEmptyDamageFormulaPart } from './part';

  const {
    damageTypeOptions,
    damageTypesPending = false,
    emptyLabel,
    fieldNamePrefix = 'damageParts',
    showVersatile = false,
    hideModifiers = false,
  } = defineProps<{
    /** Типы урона справочника — грузит редактор-хозяин, один раз на вкладку. */
    damageTypeOptions: Array<SelectOption>;
    /** Справочник ещё грузится. */
    damageTypesPending?: boolean;
    /** Текст на месте пустого списка: у заклинания и оружия он разный. */
    emptyLabel: string;
    /** Приставка имени поля формы. */
    fieldNamePrefix?: string;
    /** Показать формулу двуручного хвата у первой части (оружие). */
    showVersatile?: boolean;
    /** Скрыть вкладку модификаторов там, где модификатор добавляется сам. */
    hideModifiers?: boolean;
  }>();

  /**
   * Части урона правятся напрямую, без промежуточного списка строк: носитель
   * может обходиться вовсе без урона, поэтому пустая часть — обычное состояние
   * формы, а не то, что надо прятать от модели. Незаполненные части отбрасывает
   * нормализация перед отправкой.
   */
  const model = defineModel<Array<DamageFormulaPart>>({ required: true });

  function addPart() {
    model.value = [...model.value, createEmptyDamageFormulaPart()];
  }

  function removePart(partIndex: number) {
    model.value = model.value.filter((_, position) => position !== partIndex);
  }

  function updatePart(partIndex: number, part: DamageFormulaPart) {
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
      {{ emptyLabel }}
    </p>

    <DamagePartRow
      v-for="(part, partIndex) in model"
      :key="partIndex"
      :model-value="part"
      :index="partIndex"
      :damage-type-options="damageTypeOptions"
      :damage-types-pending="damageTypesPending"
      :field-name-prefix="fieldNamePrefix"
      :hide-modifiers="hideModifiers"
      :show-versatile="showVersatile && partIndex === 0"
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
      {{ DAMAGE_PART_LABELS.addPart }}
    </UButton>
  </div>
</template>
