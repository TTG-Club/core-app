<script setup lang="ts">
  import type { DamageFormulaToolSlot } from './constants';

  import {
    DAMAGE_FORMULA_CONDITION_TAGS,
    DAMAGE_FORMULA_CREATURE_TYPE_TAGS,
    DAMAGE_FORMULA_DICE,
    DAMAGE_FORMULA_HEALING_TAGS,
    DAMAGE_FORMULA_LABELS,
    DAMAGE_FORMULA_MODIFIER_TAGS,
  } from './constants';
  import {
    buildDamageFormulaModifier,
    buildDamageFormulaTag,
    incrementDamageFormulaDice,
    insertIntoDamageFormula,
  } from './formula';

  interface DamageTypeOption {
    /** Подпись типа урона. */
    label: string;
    /** Хвост токена без приставки `@`, напр. `dmg.fire`. */
    value: string;
  }

  const {
    damageTypeOptions,
    damageTypesPending = false,
    label = DAMAGE_FORMULA_LABELS.formula,
    placeholder = DAMAGE_FORMULA_LABELS.formulaPlaceholder,
    hideModifiers = false,
    hideHealing = false,
    hideConditions = false,
  } = defineProps<{
    /** Типы урона для одноимённой вкладки. */
    damageTypeOptions: Array<DamageTypeOption>;
    /** Справочник типов урона ещё грузится. */
    damageTypesPending?: boolean;
    /** Подпись поля формулы. */
    label?: string;
    /** Подсказка в пустом поле. */
    placeholder?: string;
    /** Скрыть вкладку модификаторов (там, где мод. добавляется сам). */
    hideModifiers?: boolean;
    /** Скрыть вкладку лечения. */
    hideHealing?: boolean;
    /** Скрыть вкладки условий: по хитам цели и по её типу. */
    hideConditions?: boolean;
  }>();

  const model = defineModel<string>({ required: true });

  const inputRef = useTemplateRef<{
    input?: HTMLInputElement;
    $el?: HTMLElement;
  }>('inputRef');

  const inputElement = computed(
    () => inputRef.value?.input ?? inputRef.value?.$el?.querySelector('input'),
  );

  const tools = computed<Array<{ label: string; slot: DamageFormulaToolSlot }>>(
    () => {
      // Порядок вкладок системы, но «Кости» впереди: в справочнике формулу
      // набирают с нуля, а не правят готовую — начинают всегда с кости.
      const items: Array<{ label: string; slot: DamageFormulaToolSlot }> = [
        { label: DAMAGE_FORMULA_LABELS.dice, slot: 'dice' },
      ];

      if (!hideModifiers) {
        items.push({
          label: DAMAGE_FORMULA_LABELS.modifiers,
          slot: 'modifiers',
        });
      }

      items.push({
        label: DAMAGE_FORMULA_LABELS.damageTypes,
        slot: 'damageTypes',
      });

      if (!hideHealing) {
        items.push({ label: DAMAGE_FORMULA_LABELS.healing, slot: 'healing' });
      }

      if (!hideConditions) {
        // Тип существа — такое же условие по цели, как и её хиты, поэтому
        // прячется тем же пропом.
        items.push(
          { label: DAMAGE_FORMULA_LABELS.conditions, slot: 'conditions' },
          {
            label: DAMAGE_FORMULA_LABELS.creatureTypes,
            slot: 'creatureTypes',
          },
        );
      }

      return items;
    },
  );

  /**
   * Возвращает границы выделения в поле формулы. Поля в DOM нет (первый рендер,
   * поле ещё не в фокусе) — вставка идёт в конец формулы.
   *
   * @returns начало и конец выделения.
   */
  function getSelection(): { start: number; end: number } {
    const element = inputElement.value;
    const length = model.value.length;

    if (!element) {
      return { start: length, end: length };
    }

    return {
      start: element.selectionStart ?? length,
      end: element.selectionEnd ?? length,
    };
  }

  /**
   * Вставляет текст на место курсора и возвращает курсор за вставленный
   * фрагмент — иначе после каждой кнопки пришлось бы заново целиться в формулу.
   *
   * @param text вставляемый текст.
   */
  async function insertText(text: string) {
    const { start, end } = getSelection();

    const insertion = insertIntoDamageFormula(model.value, text, start, end);

    model.value = insertion.formula;

    await nextTick();

    const element = inputElement.value;

    if (!element) {
      return;
    }

    element.focus();
    element.setSelectionRange(insertion.cursor, insertion.cursor);
  }

  function insertTag(tag: string) {
    return insertText(buildDamageFormulaTag(tag));
  }

  function insertModifier(modifier: string) {
    const { start } = getSelection();

    return insertText(buildDamageFormulaModifier(model.value, modifier, start));
  }

  /**
   * Кость не вставляется по курсору: у неё своё правило — уже указанная кость
   * того же размера наращивается в количестве (`1к6` → `2к6`).
   *
   * @param diceValue размер кости.
   */
  function incrementDice(diceValue: number) {
    model.value = incrementDamageFormulaDice(model.value, diceValue);
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <UFormField :label="label">
      <UInput
        ref="inputRef"
        v-model="model"
        :placeholder="placeholder"
        class="w-full font-mono"
      />
    </UFormField>

    <UTabs
      :items="tools"
      variant="link"
      class="w-full"
      :ui="{
        list: 'border-b border-default mb-2',
        trigger: 'justify-center py-1 text-xs',
        content:
          'p-2 bg-elevated/20 rounded-lg border border-default/50 min-h-15',
      }"
    >
      <template #modifiers>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="modifier in DAMAGE_FORMULA_MODIFIER_TAGS"
            :key="modifier.value"
            :label="modifier.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="insertModifier(modifier.value)"
          />
        </div>
      </template>

      <template #dice>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="dice in DAMAGE_FORMULA_DICE"
            :key="dice.value"
            :label="dice.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="incrementDice(dice.value)"
          />
        </div>
      </template>

      <template #damageTypes>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="damageType in damageTypeOptions"
            :key="damageType.value"
            :label="damageType.label"
            size="xs"
            color="neutral"
            variant="subtle"
            :loading="damageTypesPending"
            @click.left.exact.prevent="insertTag(damageType.value)"
          />
        </div>
      </template>

      <template #healing>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="healing in DAMAGE_FORMULA_HEALING_TAGS"
            :key="healing.value"
            :label="healing.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="insertTag(healing.value)"
          />
        </div>
      </template>

      <template #conditions>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="condition in DAMAGE_FORMULA_CONDITION_TAGS"
            :key="condition.value"
            :label="condition.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="insertTag(condition.value)"
          />
        </div>
      </template>

      <!-- Слагаемое достаётся только целям названного типа -->
      <template #creatureTypes>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="creatureType in DAMAGE_FORMULA_CREATURE_TYPE_TAGS"
            :key="creatureType.value"
            :label="creatureType.label"
            size="xs"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="insertTag(creatureType.value)"
          />
        </div>
      </template>
    </UTabs>
  </div>
</template>
