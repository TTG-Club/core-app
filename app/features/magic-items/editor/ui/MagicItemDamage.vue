<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';
  import type { DamageFormulaPart } from '~ui/damage-formula';

  import { DictionaryService } from '~/shared/api';
  import { DamageParts } from '~ui/damage-formula';

  import { MAGIC_ITEM_DAMAGE_EMPTY_LABEL } from '../../model';

  const model = defineModel<Array<DamageFormulaPart>>({ required: true });

  /**
   * Типы урона нужны вкладке «Тип урона» редактора формулы. Грузим здесь, один
   * раз на всю карточку: частей урона у предмета может быть несколько.
   */
  const { data: damageTypes, status: damageTypesStatus } = await useAsyncData(
    'dictionaries-damage-types',
    () => DictionaryService.damageTypes(),
    { dedupe: 'defer' },
  );

  const damageTypeOptions = computed<Array<SelectOption>>(
    () => damageTypes.value ?? [],
  );

  const isDamageTypesPending = computed(
    () => damageTypesStatus.value === 'pending',
  );
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
    <DamageParts
      v-model="model"
      :damage-type-options="damageTypeOptions"
      :damage-types-pending="isDamageTypesPending"
      :empty-label="MAGIC_ITEM_DAMAGE_EMPTY_LABEL"
      field-name-prefix="damageParts"
      hide-modifiers
    />
  </div>
</template>
