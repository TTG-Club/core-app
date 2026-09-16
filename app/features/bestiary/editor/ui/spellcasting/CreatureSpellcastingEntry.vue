<script setup lang="ts">
  import type { AbilityKey } from '~/shared/types';

  import type {
    CreatureSpellcastingBlock,
    CreatureSpellGroup,
  } from '../../../model';

  import { EditorNestedSection } from '~ui/editor';
  import { SelectAbilities } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';

  import { createEmptyCreatureSpellGroup } from '../../../model';
  import { CREATURE_SPELLCASTING_EDITOR } from '../../constants';
  import CreatureSpellGroupRow from './CreatureSpellGroupRow.vue';

  /**
   * Поля блока заклинаний: чем существо колдует и какими группами.
   *
   * Характеристика, Сл и бонус атаки живут у блока, а не у существа целиком:
   * у зелёной карги «Магия шабаша» считается от Интеллекта со Сл 11, а
   * собственное «Использование заклинаний» — от Мудрости со Сл 12 и бонусом
   * атаки +4.
   */
  const model = defineModel<CreatureSpellcastingBlock>({ required: true });

  /**
   * Записывает характеристику блока. Селект отдаёт и массив — берётся первое
   * значение: характеристика у блока одна.
   *
   * @param keys - выбранная характеристика
   */
  function setAbility(keys: AbilityKey | Array<AbilityKey> | undefined): void {
    const [picked] = Array.isArray(keys) ? keys : [keys];

    model.value.ability = picked;
  }

  /** Заводит группу в конце списка. */
  function addGroup(): void {
    model.value.groups.push(createEmptyCreatureSpellGroup());
  }

  /**
   * Убирает группу вместе с её заклинаниями.
   *
   * @param index - позиция группы в списке
   */
  function removeGroup(index: number): void {
    model.value.groups.splice(index, 1);
  }

  /**
   * Заменяет группу целиком.
   *
   * Группа правится по полям и приезжает тем же объектом, но присваивание
   * оставлено: без него у строки не было бы обработчика обновления, и её
   * `defineModel` ушёл бы в локальный режим.
   *
   * @param index - позиция группы в списке
   * @param group - новая группа
   */
  function updateGroup(index: number, group: CreatureSpellGroup): void {
    model.value.groups[index] = group;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Поля блока строкой, а не сеткой: их шесть, и в 24 колонки они
      растягивались на три ряда полупустых ячеек. Перенос делает `flex-wrap` —
      на узком экране каждое поле занимает строку целиком -->
    <div class="flex flex-wrap items-end gap-3">
      <UFormField
        class="w-full min-w-40 sm:flex-1"
        :label="CREATURE_SPELLCASTING_EDITOR.name"
        name="name"
      >
        <UInput
          v-model="model.name"
          :placeholder="CREATURE_SPELLCASTING_EDITOR.namePlaceholder"
        />
      </UFormField>

      <UFormField
        class="w-full sm:w-56"
        :label="CREATURE_SPELLCASTING_EDITOR.ability"
        name="ability"
      >
        <SelectAbilities
          :model-value="model.ability"
          :placeholder="CREATURE_SPELLCASTING_EDITOR.abilityPlaceholder"
          @update:model-value="setAbility"
        />
      </UFormField>

      <UFormField
        class="w-full sm:w-32"
        name="saveDc"
      >
        <template #label>
          <InfoTooltip
            :text="CREATURE_SPELLCASTING_EDITOR.saveDcHint"
            icon="tabler:info-circle-filled"
          >
            <span>{{ CREATURE_SPELLCASTING_EDITOR.saveDc }}</span>
          </InfoTooltip>
        </template>

        <UInputNumber
          v-model="model.saveDc"
          :placeholder="CREATURE_SPELLCASTING_EDITOR.saveDcPlaceholder"
          :aria-label="CREATURE_SPELLCASTING_EDITOR.saveDc"
        />
      </UFormField>

      <UFormField
        class="w-full sm:w-32"
        name="attackBonus"
      >
        <template #label>
          <InfoTooltip
            :text="CREATURE_SPELLCASTING_EDITOR.attackBonusHint"
            icon="tabler:info-circle-filled"
          >
            <span>{{ CREATURE_SPELLCASTING_EDITOR.attackBonus }}</span>
          </InfoTooltip>
        </template>

        <UInputNumber
          v-model="model.attackBonus"
          :placeholder="CREATURE_SPELLCASTING_EDITOR.attackBonusPlaceholder"
          :aria-label="CREATURE_SPELLCASTING_EDITOR.attackBonus"
        />
      </UFormField>
    </div>

    <div class="flex flex-wrap items-end gap-3">
      <UFormField class="w-full sm:w-auto">
        <template #label>
          <InfoTooltip
            :text="CREATURE_SPELLCASTING_EDITOR.componentsHint"
            icon="tabler:info-circle-filled"
          >
            <span>{{ CREATURE_SPELLCASTING_EDITOR.components }}</span>
          </InfoTooltip>
        </template>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 py-1.5">
          <UCheckbox
            v-model="model.ignoredComponents.verbal"
            :label="CREATURE_SPELLCASTING_EDITOR.componentVerbal"
          />

          <UCheckbox
            v-model="model.ignoredComponents.somatic"
            :label="CREATURE_SPELLCASTING_EDITOR.componentSomatic"
          />

          <UCheckbox
            v-model="model.ignoredComponents.material"
            :label="CREATURE_SPELLCASTING_EDITOR.componentMaterial"
          />
        </div>
      </UFormField>

      <UFormField
        class="w-full min-w-40 sm:flex-1"
        name="note"
      >
        <template #label>
          <InfoTooltip
            :text="CREATURE_SPELLCASTING_EDITOR.noteHint"
            icon="tabler:info-circle-filled"
          >
            <span>{{ CREATURE_SPELLCASTING_EDITOR.note }}</span>
          </InfoTooltip>
        </template>

        <UInput
          v-model="model.note"
          :placeholder="CREATURE_SPELLCASTING_EDITOR.notePlaceholder"
        />
      </UFormField>
    </div>

    <EditorNestedSection
      :title="CREATURE_SPELLCASTING_EDITOR.groups"
      :hint="CREATURE_SPELLCASTING_EDITOR.groupsHint"
      :count="model.groups.length"
      :add-label="CREATURE_SPELLCASTING_EDITOR.addGroup"
      :collapsible="false"
      @add="addGroup"
    >
      <CreatureSpellGroupRow
        v-for="(group, index) in model.groups"
        :key="index"
        :model-value="group"
        @update:model-value="updateGroup(index, $event)"
        @remove="removeGroup(index)"
      />
    </EditorNestedSection>
  </div>
</template>
