<script setup lang="ts">
  import type {
    CreatureSenses,
    CreateSkill,
    CreateAbility,
  } from '~bestiary/types';

  const model = defineModel<CreatureSenses>({ required: true });

  const { wisdom, skills, proficiencyBonus } = defineProps<{
    wisdom: CreateAbility;
    skills: Array<CreateSkill>;
    proficiencyBonus: number;
  }>();

  watchEffect(() => {
    const wisdomMod = getModifier(wisdom.value);

    const perception = skills.find((skill) => skill.skill === 'PERCEPTION');

    if (perception) {
      model.value.passivePerception =
        10 + wisdomMod + perception.multiplier * proficiencyBonus;
    } else {
      model.value.passivePerception = 10 + wisdomMod;
    }
  });
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Чувства</h2>
    </template>

    <div class="grid gap-4">
      <UForm
        class="col-span-full grid grid-cols-25 gap-4"
        attach
        :state="model"
      >
        <UFormField
          label="Тёмное зрение"
          name="darkvision"
          class="col-span-5"
        >
          <UFieldGroup>
            <UInputNumber
              v-model="model.darkvision"
              :min="0"
              :precision="0"
              placeholder="В фт."
            />

            <UBadge
              color="neutral"
              variant="subtle"
            >
              фт.
            </UBadge>
          </UFieldGroup>
        </UFormField>

        <UFormField
          label="Истинное зрение"
          name="truesight"
          class="col-span-5"
        >
          <UFieldGroup>
            <UInputNumber
              v-model="model.truesight"
              :min="0"
              :precision="0"
              placeholder="В фт."
            />

            <UBadge
              color="neutral"
              variant="subtle"
            >
              фт.
            </UBadge>
          </UFieldGroup>
        </UFormField>

        <UFormField
          label="Слепое зрение"
          name="blindsight"
          class="col-span-5"
        >
          <UFieldGroup>
            <UInputNumber
              v-model="model.blindsight"
              :min="0"
              :precision="0"
              placeholder="В фт."
            />

            <UBadge
              color="neutral"
              variant="subtle"
            >
              фт.
            </UBadge>
          </UFieldGroup>
        </UFormField>

        <UFormField
          label="Чувство вибрации"
          name="tremorsense"
          class="col-span-5"
        >
          <UFieldGroup>
            <UInputNumber
              v-model="model.tremorsense"
              :min="0"
              :precision="0"
              placeholder="В фт."
            />

            <UBadge
              color="neutral"
              variant="subtle"
            >
              фт.
            </UBadge>
          </UFieldGroup>
        </UFormField>

        <UFormField
          label="Пассивная Внимательность"
          name="passivePerception"
          class="col-span-5"
        >
          <UFieldGroup>
            <UInputNumber
              v-model="model.passivePerception"
              :min="0"
              :precision="0"
              placeholder="Введите значение"
            />

            <UBadge
              color="neutral"
              variant="subtle"
            >
              фт.
            </UBadge>
          </UFieldGroup>
        </UFormField>

        <UFormField
          name="unimpeded"
          class="w-ful col-span-full"
        >
          <UCheckbox
            v-model="model.unimpeded"
            label="Супер темное зрение"
          >
          </UCheckbox>
        </UFormField>
      </UForm>
    </div>
  </UCard>
</template>
