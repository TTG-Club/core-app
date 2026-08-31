<script setup lang="ts">
  import type { ClassFeatureAbilityBonusCreate } from '../../../model';

  import { EditorNestedSection } from '~ui/editor';
  import { SelectAbilities } from '~ui/select';

  import {
    CLASS_ABILITY_BONUS_BOUNDS,
    CLASS_ABILITY_BONUS_DEFAULTS,
    CLASS_FEATURES_EDITOR,
  } from '../../../model';

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

  /** Записей в блоке: прибавка у умения либо одна, либо её нет. */
  const count = computed(() => (model.value ? 1 : 0));

  /**
   * Подпись кнопки добавления в шапке блока; пусто — прибавка уже задана, и
   * добавлять нечего: она у умения одна.
   */
  const addLabel = computed(() =>
    model.value ? undefined : CLASS_FEATURES_EDITOR.addAbilityBonus,
  );

  /** Заводит прибавку с пределом эпических умений. */
  function add() {
    model.value = { abilities: [], ...CLASS_ABILITY_BONUS_DEFAULTS };
  }

  function remove() {
    model.value = undefined;
  }
</script>

<template>
  <EditorNestedSection
    :title="CLASS_FEATURES_EDITOR.abilityBonusTitle"
    :hint="CLASS_FEATURES_EDITOR.abilityBonusHint"
    :count="count"
    :add-label="addLabel"
    @add="add"
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
          :min="CLASS_ABILITY_BONUS_BOUNDS.bonus.min"
          :max="CLASS_ABILITY_BONUS_BOUNDS.bonus.max"
        />
      </UFormField>

      <UFormField
        class="md:col-span-5"
        :label="CLASS_FEATURES_EDITOR.abilityBonusUpto"
        name="upto"
      >
        <UInputNumber
          v-model="model.upto"
          :min="CLASS_ABILITY_BONUS_BOUNDS.upto.min"
          :max="CLASS_ABILITY_BONUS_BOUNDS.upto.max"
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
  </EditorNestedSection>
</template>
