<script setup lang="ts">
  import type { ClassFeatureAbilityBonusCreate } from '../../../model';

  import { SelectAbilities } from '~ui/select';

  import { CLASS_FEATURES_EDITOR } from '../../../model';
  import FeatureSection from './FeatureSection.vue';

  /**
   * Прибавка характеристик умением 20 уровня — «Первобытный чемпион»
   * варвара: названные характеристики растут на число, но не выше предела.
   *
   * Своим блоком, а не строкой даров: у механики класса блока повышений нет,
   * и в строки даров такая прибавка не ложится.
   */
  const model = defineModel<ClassFeatureAbilityBonusCreate | undefined>({
    required: true,
  });

  /** Заводит прибавку с пределом эпических умений. */
  function add() {
    model.value = { abilities: [], bonus: 4, upto: 24 };
  }

  function remove() {
    model.value = undefined;
  }
</script>

<template>
  <FeatureSection
    :title="CLASS_FEATURES_EDITOR.abilityBonusTitle"
    :hint="CLASS_FEATURES_EDITOR.abilityBonusHint"
    :count="model ? 1 : 0"
  >
    <UForm
      v-if="model"
      class="grid grid-cols-1 gap-3 rounded-lg border border-default bg-elevated/40 p-3 md:grid-cols-24"
      :state="model"
      attach
    >
      <UFormField
        class="md:col-span-12"
        :label="CLASS_FEATURES_EDITOR.abilityBonusAbilities"
        name="abilities"
      >
        <SelectAbilities
          v-model="model.abilities"
          :limit="2"
          multiple
        />
      </UFormField>

      <UFormField
        class="md:col-span-5"
        :label="CLASS_FEATURES_EDITOR.abilityBonusValue"
        name="bonus"
      >
        <UInputNumber
          v-model="model.bonus"
          :min="1"
          :max="10"
        />
      </UFormField>

      <UFormField
        class="md:col-span-5"
        :label="CLASS_FEATURES_EDITOR.abilityBonusUpto"
        name="upto"
      >
        <UInputNumber
          v-model="model.upto"
          :min="20"
          :max="30"
        />
      </UFormField>

      <div class="flex justify-end md:col-span-2 md:self-end md:pb-2">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="CLASS_FEATURES_EDITOR.removeAbilityBonus"
          @click.left.exact.prevent="remove"
        />
      </div>
    </UForm>

    <UButton
      v-else
      icon="tabler:plus"
      :label="CLASS_FEATURES_EDITOR.addAbilityBonus"
      color="primary"
      variant="soft"
      block
      @click.left.exact.prevent="add"
    />
  </FeatureSection>
</template>
