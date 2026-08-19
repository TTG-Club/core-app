<script setup lang="ts">
  import type { FeatModifiers } from '../../model';

  import {
    SelectCondition,
    SelectCreatureType,
    SelectDamageType,
  } from '~ui/select';

  import { createSenseGrant, FEAT_SENSE_OPTIONS } from '../../model';

  const model = defineModel<FeatModifiers>({ required: true });

  function addSense() {
    model.value = {
      ...model.value,
      senses: [...model.value.senses, createSenseGrant()],
    };
  }

  function removeSense(index: number) {
    model.value = {
      ...model.value,
      senses: model.value.senses.filter((_, position) => position !== index),
    };
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
    <p class="text-sm text-dimmed md:col-span-full">
      Только постоянные эффекты. Условные — «+1 к КД в доспехе», «сопротивление
      в темноте» — остаются в описании.
    </p>

    <UFormField
      class="md:col-span-8"
      label="Хиты: постоянная прибавка"
    >
      <UInputNumber v-model="model.hitPoints.flat" />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Хиты: за уровень взятия"
    >
      <UInputNumber v-model="model.hitPoints.perAcquisitionLevel" />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Хиты: за каждый уровень после"
    >
      <UInputNumber v-model="model.hitPoints.perLevelAfterAcquisition" />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Скорость ходьбы, прибавка"
    >
      <UInputNumber
        v-model="model.speed.walkBonus"
        :step="5"
      />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Полёт"
    >
      <UInputNumber
        v-model="model.speed.fly"
        :min="0"
        :step="5"
      />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Лазание"
    >
      <UInputNumber
        v-model="model.speed.climb"
        :min="0"
        :step="5"
      />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Плавание"
    >
      <UInputNumber
        v-model="model.speed.swim"
        :min="0"
        :step="5"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Полёт равен ходьбе"
    >
      <UCheckbox v-model="model.speed.flyEqualsWalk" />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Лазание равно ходьбе"
    >
      <UCheckbox v-model="model.speed.climbEqualsWalk" />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Плавание равно ходьбе"
    >
      <UCheckbox v-model="model.speed.swimEqualsWalk" />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Прибавка к КД"
    >
      <UInputNumber v-model="model.armorClassBonus" />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Дальность телепатии"
    >
      <UInputNumber
        v-model="model.telepathyRange"
        :min="0"
        :step="5"
      />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Прибавка к инициативе"
      help="Например, +5 у «Бдительного» издания 2014"
    >
      <UInputNumber v-model="model.initiativeBonus" />
    </UFormField>

    <UFormField
      class="md:col-span-6"
      label="Бонус мастерства к инициативе"
    >
      <UCheckbox
        v-model="model.initiativeProficiencyBonus"
        label="Как у черты «Бдительный»"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Сопротивление урону"
    >
      <SelectDamageType
        v-model="model.damage.resistances"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Иммунитет к урону"
    >
      <SelectDamageType
        v-model="model.damage.immunities"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Уязвимость к урону"
    >
      <SelectDamageType
        v-model="model.damage.vulnerabilities"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Сопротивление типу урона из выбора"
    >
      <UInput
        v-model="model.damage.resistanceFromChoiceKey"
        placeholder="damage-type"
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Иммунитет к состояниям"
    >
      <SelectCondition
        v-model="model.conditionImmunities"
        multiple
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      label="Новый тип существа"
    >
      <SelectCreatureType v-model="model.creatureType" />
    </UFormField>

    <div class="md:col-span-full">
      <div class="mb-2 flex items-center justify-between gap-4">
        <span class="text-sm text-dimmed">Чувства с дистанцией в футах.</span>

        <UButton
          icon="tabler:plus"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="addSense"
        >
          Добавить
        </UButton>
      </div>

      <div class="flex flex-col gap-2">
        <p
          v-if="!model.senses.length"
          class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
        >
          Черта не даёт чувств.
        </p>

        <div
          v-for="(sense, index) in model.senses"
          :key="index"
          class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
        >
          <UFormField
            class="col-span-full md:col-span-18"
            label="Чувство"
          >
            <USelectMenu
              v-model="sense.type"
              :items="FEAT_SENSE_OPTIONS"
              value-key="value"
            />
          </UFormField>

          <UFormField
            class="col-span-20 md:col-span-5"
            label="Дистанция"
          >
            <UInputNumber
              v-model="sense.range"
              :min="0"
              :step="5"
            />
          </UFormField>

          <div class="col-span-4 flex justify-end md:col-span-1">
            <UButton
              color="error"
              icon="tabler:trash"
              size="xs"
              variant="ghost"
              @click.left.exact.prevent="removeSense(index)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
