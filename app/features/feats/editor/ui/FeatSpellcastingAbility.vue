<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type { FeatSpellChoiceBlock } from '../../model';

  import { SelectAbilities } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import { FEAT_EDITOR_LABELS } from '../../model';

  /**
   * Характеристика, от которой считаются заклинания черты.
   *
   * Одно поле на три случая: пусто — характеристику задаёт класс, чья это магия;
   * одна — она и есть; несколько — лист даст игроку выбрать одну из них. Так
   * автору не приходится выбирать между «задать» и «спросить»: это одно и то же
   * поле с разным числом значений.
   */
  const model = defineModel<FeatSpellChoiceBlock>({ required: true });

  /**
   * Записывает характеристики, из которых считаются заклинания черты.
   *
   * @param keys выбранные характеристики.
   */
  function setAbilities(keys: AbilityKey | Array<AbilityKey> | undefined) {
    const picked = Array.isArray(keys) ? keys : [keys];

    model.value = {
      ...model.value,
      abilityOptions: picked.filter((key) => key !== undefined),
    };
  }
</script>

<template>
  <UFormField>
    <template #label>
      <InfoTooltip
        :text="FEAT_EDITOR_LABELS.spellcastingAbilityHint"
        icon="tabler:info-circle-filled"
      >
        <span>{{ FEAT_EDITOR_LABELS.spellcastingAbility }}</span>
      </InfoTooltip>
    </template>

    <SelectAbilities
      :model-value="model.abilityOptions"
      multiple
      :placeholder="FEAT_EDITOR_LABELS.spellcastingAbilityPlaceholder"
      @update:model-value="setAbilities"
    />
  </UFormField>
</template>
