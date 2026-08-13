<script setup lang="ts">
  import type { FeatChoice } from '../../model';

  import { SelectMagicSchool, SelectSpellLevel } from '~ui/select';

  import {
    createFeatChoice,
    createSpellFilter,
    FEAT_CASTING_TIME_OPTIONS,
    FEAT_CHOICE_TYPE_OPTIONS,
    SPELL_FEAT_CHOICE_TYPES,
  } from '../../model';

  /** Нужен ли выбору фильтр заклинаний. */
  function isSpellChoice(choice: FeatChoice): boolean {
    return !!choice.type && SPELL_FEAT_CHOICE_TYPES.includes(choice.type);
  }

  const model = defineModel<Array<FeatChoice>>({ default: () => [] });

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

  function toggleSpellFilter(
    index: number,
    enabled: boolean | 'indeterminate',
  ) {
    patchChoice(index, {
      spellFilter: enabled === true ? createSpellFilter() : undefined,
    });
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4">
      <span class="text-sm text-dimmed">
        Только выборы в момент взятия черты. Выборы по ходу игры («выберите
        существо в пределах 30 футов») сюда не идут.
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
      >
        <UInput
          v-model="choice.key"
          placeholder="damage-type"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        label="Что выбирают"
      >
        <USelectMenu
          v-model="choice.type"
          :items="FEAT_CHOICE_TYPE_OPTIONS"
          value-key="value"
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

      <UFormField
        class="col-span-12 md:col-span-4"
        label="Только без владения"
      >
        <UCheckbox v-model="choice.onlyIfNotProficient" />
      </UFormField>

      <UFormField
        class="col-span-12 md:col-span-5"
        label="Владеет — компетентность"
      >
        <UCheckbox v-model="choice.expertiseIfProficient" />
      </UFormField>

      <UFormField
        class="col-span-12 md:col-span-5"
        label="Меняется на отдыхе"
      >
        <UCheckbox v-model="choice.rechooseOnLongRest" />
      </UFormField>

      <template v-if="isSpellChoice(choice)">
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
