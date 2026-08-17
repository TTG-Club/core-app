<script setup lang="ts">
  import type { FeatChoice, FeatChoiceType } from '../../model';

  import { InputWithLibrary } from '~ui/input';
  import { SelectMagicSchool, SelectSpellLevel } from '~ui/select';

  import {
    createFeatChoice,
    createSpellFilter,
    FEAT_CASTING_TIME_OPTIONS,
    FEAT_CHOICE_GRANT_OPTIONS,
    FEAT_CHOICE_KEY_BY_TYPE,
    FEAT_CHOICE_KEY_SUGGESTIONS,
    FEAT_CHOICE_TYPE_OPTIONS,
    getFreeFeatChoiceKey,
    isExpertiseChoiceType,
    isProficiencyChoiceType,
    isSpellChoiceType,
  } from '../../model';

  const model = defineModel<Array<FeatChoice>>({ default: () => [] });

  /** Ключи, занятые остальными выборами черты. */
  function getTakenKeys(exceptIndex: number): Array<string> {
    return model.value
      .filter((_, position) => position !== exceptIndex)
      .map((choice) => choice.key.trim())
      .filter((key) => !!key);
  }

  /** Ключи, встречающиеся у нескольких выборов сразу. */
  const duplicateKeys = computed(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const choice of model.value) {
      const key = choice.key.trim();

      if (!key) {
        continue;
      }

      if (seen.has(key)) {
        duplicates.add(key);
      }

      seen.add(key);
    }

    return duplicates;
  });

  function addChoice() {
    model.value = [...model.value, createFeatChoice()];
  }

  function removeChoice(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  function patchChoice(index: number, patch: Partial<FeatChoice>) {
    model.value = model.value.map((choice, position) =>
      position === index ? { ...choice, ...patch } : choice,
    );
  }

  /**
   * Смена типа выбора заодно подсказывает ключ, но только пустому полю:
   * введённое руками имя не перетирается, а занятое в этой черте получает
   * номер.
   *
   * @param index номер выбора в списке.
   * @param type новый тип выбора.
   */
  function changeType(index: number, type: FeatChoiceType | undefined) {
    const choice = model.value[index];

    if (!choice) {
      return;
    }

    if (!type || choice.key.trim()) {
      patchChoice(index, { type });

      return;
    }

    patchChoice(index, {
      type,
      key: getFreeFeatChoiceKey(
        FEAT_CHOICE_KEY_BY_TYPE[type],
        getTakenKeys(index),
      ),
    });
  }

  function toggleSpellFilter(
    index: number,
    enabled: boolean | 'indeterminate',
  ) {
    patchChoice(index, {
      spellFilter: enabled === true ? createSpellFilter() : undefined,
    });
  }

  /**
   * Ограничения пула взаимно исключают друг друга: вместе они не оставляют, из
   * чего выбирать, поэтому включение одного снимает второе.
   *
   * @param index номер выбора в списке.
   * @param enabled новое значение отметки.
   */
  function toggleOnlyIfProficient(
    index: number,
    enabled: boolean | 'indeterminate',
  ) {
    const isEnabled = enabled === true;

    patchChoice(
      index,
      isEnabled
        ? { onlyIfProficient: true, onlyIfNotProficient: false }
        : { onlyIfProficient: false },
    );
  }

  /**
   * Обратная отметка пула — с тем же взаимным исключением.
   *
   * @param index номер выбора в списке.
   * @param enabled новое значение отметки.
   */
  function toggleOnlyIfNotProficient(
    index: number,
    enabled: boolean | 'indeterminate',
  ) {
    const isEnabled = enabled === true;

    patchChoice(
      index,
      isEnabled
        ? { onlyIfNotProficient: true, onlyIfProficient: false }
        : { onlyIfNotProficient: false },
    );
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4">
      <span class="text-sm text-dimmed">
        Только выборы в момент взятия черты. Выборы по ходу игры («выберите
        существо в пределах 30 футов») сюда не идут. Ключ — имя выбора: по нему
        на него ссылается повышение характеристик и по нему лист персонажа
        помнит ответ игрока, поэтому у черты, которую уже могли взять, ключ
        менять нельзя — сохранённый выбор потеряется.
      </span>

      <UButton
        icon="tabler:plus"
        size="xs"
        variant="ghost"
        @click.left.exact.prevent="addChoice"
      >
        Добавить выбор
      </UButton>
    </div>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      Черта не требует выбора при взятии.
    </p>

    <div
      v-for="(choice, index) in model"
      :key="index"
      class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        class="col-span-full md:col-span-6"
        label="Ключ"
        :error="
          duplicateKeys.has(choice.key.trim())
            ? 'Такой ключ в черте уже есть'
            : undefined
        "
      >
        <InputWithLibrary
          v-model="choice.key"
          :options="FEAT_CHOICE_KEY_SUGGESTIONS"
          placeholder="damage-type"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        label="Что выбирают"
      >
        <USelectMenu
          :items="FEAT_CHOICE_TYPE_OPTIONS"
          :model-value="choice.type"
          value-key="value"
          @update:model-value="changeType(index, $event)"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-9"
        label="Подпись для игрока"
      >
        <UInput
          v-model="choice.label"
          placeholder="Выберите тип урона"
        />
      </UFormField>

      <div class="col-span-full flex justify-end md:col-span-1">
        <UButton
          color="error"
          icon="tabler:trash"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="removeChoice(index)"
        />
      </div>

      <UFormField
        class="col-span-12 md:col-span-4"
        label="Сколько выбрать"
      >
        <UInputNumber
          v-model="choice.count"
          :min="1"
        />
      </UFormField>

      <UFormField
        class="col-span-12 md:col-span-6"
        label="Количество = бонус мастерства"
      >
        <UCheckbox v-model="choice.countEqualsProficiencyBonus" />
      </UFormField>

      <!-- Ограничить пул уже имеющимся владением можно только там, где владение
        бывает: у заклинания или типа урона его нет, и отметки лишь путали бы -->
      <template v-if="isProficiencyChoiceType(choice.type)">
        <UFormField
          class="col-span-12 md:col-span-4"
          label="Только без владения"
        >
          <UCheckbox
            :model-value="choice.onlyIfNotProficient"
            @update:model-value="toggleOnlyIfNotProficient(index, $event)"
          />
        </UFormField>

        <UFormField
          class="col-span-12 md:col-span-4"
          label="Только с владением"
        >
          <UCheckbox
            :model-value="choice.onlyIfProficient"
            @update:model-value="toggleOnlyIfProficient(index, $event)"
          />
        </UFormField>
      </template>

      <!-- Компетентность удваивает бонус мастерства в проверке, поэтому бывает
        только у навыков и инструментов -->
      <template v-if="isExpertiseChoiceType(choice.type)">
        <UFormField
          class="col-span-12 md:col-span-6"
          label="Что даёт выбор"
        >
          <USelectMenu
            v-model="choice.grants"
            :items="FEAT_CHOICE_GRANT_OPTIONS"
            value-key="value"
          />
        </UFormField>

        <UFormField
          class="col-span-12 md:col-span-5"
          label="Владеет — компетентность"
        >
          <UCheckbox v-model="choice.expertiseIfProficient" />
        </UFormField>
      </template>

      <UFormField
        class="col-span-12 md:col-span-5"
        label="Меняется на отдыхе"
      >
        <UCheckbox v-model="choice.rechooseOnLongRest" />
      </UFormField>

      <template v-if="isSpellChoiceType(choice.type)">
        <UFormField
          class="col-span-full md:col-span-6"
          label="Ограничить заклинания"
        >
          <UCheckbox
            :model-value="!!choice.spellFilter"
            @update:model-value="toggleSpellFilter(index, $event)"
          />
        </UFormField>

        <template v-if="choice.spellFilter">
          <UFormField
            class="col-span-12 md:col-span-5"
            label="Уровень"
          >
            <SelectSpellLevel v-model="choice.spellFilter.level" />
          </UFormField>

          <UFormField
            class="col-span-12 md:col-span-5"
            label="Не выше уровня"
          >
            <SelectSpellLevel v-model="choice.spellFilter.maxLevel" />
          </UFormField>

          <UFormField
            class="col-span-full md:col-span-4"
            label="Школы"
          >
            <SelectMagicSchool
              v-model="choice.spellFilter.schools"
              multiple
            />
          </UFormField>

          <UFormField
            class="col-span-full md:col-span-4"
            label="Время накладывания"
          >
            <USelectMenu
              v-model="choice.spellFilter.castingTime"
              :items="FEAT_CASTING_TIME_OPTIONS"
              value-key="value"
            />
          </UFormField>
        </template>
      </template>
    </div>
  </div>
</template>
