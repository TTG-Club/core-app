<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';

  import type { FeatAbilityBonus, FeatChoice } from '../../model';

  import { SelectAbilities } from '~ui/select';

  import { createAbilityBonus } from '../../model';

  const { choices } = defineProps<{
    /** Выборы черты: повышение может быть привязано к одному из них. */
    choices: Array<FeatChoice>;
  }>();

  const model = defineModel<Array<FeatAbilityBonus>>({ default: () => [] });

  /**
   * Заведённые выборы как варианты привязки. Пустой привязке отдельного
   * варианта нет: значением списка она была бы пустой строкой, а с ней список
   * не открывается вовсе — снимает привязку кнопка рядом.
   */
  const choiceOptions = computed<Array<SelectOption>>(() =>
    choices
      .map((choice) => ({ key: choice.key.trim(), label: choice.label.trim() }))
      .filter(({ key }) => !!key)
      .map(({ key, label }) => ({
        value: key,
        label: label ? `${key} — ${label}` : key,
      })),
  );

  /**
   * Варианты для каждой строки: ключ загруженной записи может ссылаться на
   * выбор, которого в черте больше нет. Молча подменять такую ссылку пустотой
   * нельзя — она уйдёт на сервер потерянной, поэтому значение остаётся в
   * списке с пометкой.
   */
  const optionsByBonus = computed<Array<Array<SelectOption>>>(() =>
    model.value.map((bonus) => {
      const key = bonus.fromChoiceKey.trim();

      if (!key || choiceOptions.value.some((option) => option.value === key)) {
        return choiceOptions.value;
      }

      return [
        ...choiceOptions.value,
        { value: key, label: `${key} — выбора с таким ключом нет` },
      ];
    }),
  );

  function addBonus() {
    model.value = [...model.value, createAbilityBonus()];
  }

  function removeBonus(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  /**
   * Привязка к выбору: снятая ссылка хранится пустой строкой, а не ничем — так
   * её ждёт отправка.
   *
   * @param bonus вариант повышения характеристик.
   * @param key ключ выбранного выбора.
   */
  function setChoiceKey(bonus: FeatAbilityBonus, key: string | undefined) {
    bonus.fromChoiceKey = key ?? '';
  }

  /** Есть ли к чему привязывать. */
  const hasChoices = computed(() => choiceOptions.value.length > 0);
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4">
      <span class="text-sm text-dimmed">
        Несколько вариантов — это выбор «или»: «Улучшение характеристик» даёт +2
        к одной либо +1 к двум.
      </span>

      <UButton
        icon="tabler:plus"
        size="xs"
        variant="ghost"
        @click.left.exact.prevent="addBonus"
      >
        Добавить вариант
      </UButton>
    </div>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      Черта не повышает характеристики.
    </p>

    <div
      v-for="(bonus, index) in model"
      :key="index"
      class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        class="col-span-full md:col-span-10"
        label="Характеристики на выбор"
      >
        <SelectAbilities
          v-model="bonus.abilities"
          :limit="6"
          multiple
        />
      </UFormField>

      <UFormField
        class="col-span-8 md:col-span-3"
        label="Прибавка"
      >
        <UInputNumber
          v-model="bonus.bonus"
          :min="1"
        />
      </UFormField>

      <UFormField
        class="col-span-8 md:col-span-3"
        label="Сколько выбрать"
      >
        <UInputNumber
          v-model="bonus.count"
          :min="1"
        />
      </UFormField>

      <UFormField
        class="col-span-8 md:col-span-3"
        label="Предел"
      >
        <UInputNumber
          v-model="bonus.upto"
          :max="30"
          :min="1"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-4"
        label="Ключ выбора"
        :help="
          hasChoices
            ? undefined
            : 'Сначала заведи выбор в блоке «Выборы при взятии черты»'
        "
      >
        <div class="flex w-full gap-1">
          <USelectMenu
            :items="optionsByBonus[index]"
            :model-value="bonus.fromChoiceKey || undefined"
            value-key="value"
            placeholder="Не привязано"
            class="flex-1"
            @update:model-value="setChoiceKey(bonus, $event)"
          />

          <UButton
            v-if="bonus.fromChoiceKey"
            icon="tabler:x"
            variant="ghost"
            color="neutral"
            aria-label="Снять привязку"
            @click.left.exact.prevent="setChoiceKey(bonus, undefined)"
          />
        </div>
      </UFormField>

      <div class="col-span-full flex justify-end md:col-span-1">
        <UButton
          color="error"
          icon="tabler:trash"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="removeBonus(index)"
        />
      </div>
    </div>
  </div>
</template>
