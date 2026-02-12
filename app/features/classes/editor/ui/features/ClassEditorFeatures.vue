<script setup lang="ts">
  import { FeatureAbilityBonus } from '~classes/editor/ui/features/ui';
  import { EditorArrayControls } from '~ui/editor';
  import { SelectLevel } from '~ui/select';

  import { FeatureScaling } from './ui';

  import type { ClassFeatureCreate } from '~classes/types';

  const { isSubclass = false } = defineProps<{
    isSubclass?: boolean;
  }>();

  const state = defineModel<Array<ClassFeatureCreate>>({ required: true });

  function addEmptyFeature() {
    state.value.push(getEmptyFeature());
  }

  function getEmptyFeature(): ClassFeatureCreate {
    return {
      level: 1,
      name: '',
      description: '',
      additional: '',
      hideInSubclasses: false,
      abilityImprovement: false,
      scaling: [],
      abilityBonus: {
        abilities: [],
        bonus: 0,
        upto: 25,
      },
    };
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">Умения класса</h2>
    </template>

    <div class="flex flex-col gap-4">
      <template
        v-for="(feat, index) in state"
        :key="index"
      >
        <UCard variant="subtle">
          <UForm
            class="grid grid-cols-24 gap-4"
            attach
            :state="feat"
          >
            <UFormField
              class="col-span-4"
              label="Уровень"
              name="level"
            >
              <SelectLevel v-model="feat.level" />
            </UFormField>

            <UFormField
              :class="isSubclass ? 'col-span-12' : 'col-span-8'"
              label="Название"
              name="name"
            >
              <UInput
                v-model="feat.name"
                placeholder="Название умения"
              />
            </UFormField>

            <UFormField
              v-if="!isSubclass"
              class="col-span-4"
              label="Скрывать в подклассе?"
              name="hideInSubclasses"
            >
              <UCheckbox
                v-model="feat.hideInSubclasses"
                description="Да"
              />
            </UFormField>

            <EditorArrayControls
              v-model="state"
              :item="feat"
              :empty-object="getEmptyFeature()"
              :index="index"
              cols="8"
              only-remove
            />

            <UFormField
              class="col-span-18"
              label="Подсказка"
              name="additional"
            >
              <UInput
                v-model="feat.additional"
                placeholder="Краткая подсказка"
              />
            </UFormField>

            <UFormField
              class="col-span-6"
              label="Увеличивает характеристики?"
              name="abilityImprovement"
            >
              <UCheckbox
                v-model="feat.abilityImprovement"
                description="Да"
              />
            </UFormField>

            <UFormField
              class="col-span-full"
              label="Описание"
              name="description"
            >
              <UTextarea
                v-model="feat.description"
                :rows="3"
                placeholder="Описание умения"
              />
            </UFormField>

            <FeatureScaling
              v-model="feat.scaling"
              :is-subclass="isSubclass"
            />

            <FeatureAbilityBonus
              v-if="feat.level >= 20"
              v-model="feat.abilityBonus"
            />
          </UForm>
        </UCard>
      </template>
    </div>

    <div
      v-if="!state.length"
      class="grid place-items-center py-2"
    >
      <UButton @click.left.exact.prevent="addEmptyFeature">
        Добавить умение
      </UButton>
    </div>
  </UCard>
</template>
