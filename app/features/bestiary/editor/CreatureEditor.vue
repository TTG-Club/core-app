<script setup lang="ts">
  import {
    CreatureSection,
    CreatureChallengeRating,
    CreatureAbilities,
    CreatureAction,
    CreatureHit,
    CreatureLanguages,
    CreatureSenses,
    CreatureSize,
    CreatureSkills,
    CreatureSpeed,
    CreatureTrait,
    CreatureType,
    CreatureDefenses,
    CreatureInitiative,
  } from './ui';

  import { EditorBaseInfo } from '~ui/editor';
  import { SelectAlignment } from '~ui/select';
  import { UploadImage } from '~ui/upload';

  import type { CreatureCreate } from '~bestiary/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<CreatureCreate>({ required: true });

  const formRef = useTemplateRef('formRef');

  const validate = () => {
    return formRef.value?.validate();
  };

  defineExpose({
    validate,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state="form"
    :disabled="isCreating"
    class="grid grid-cols-24 gap-4"
  >
    <CreatureSection v-model="form.section" />

    <EditorBaseInfo
      v-model="form"
      section="bestiary"
    />

    <UFormField
      class="col-span-24"
      label="Описание"
      name="description"
    >
      <UTextarea
        v-model="form.description"
        :rows="4"
        placeholder="Введи описание"
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Заголовок</span>
    </USeparator>

    <CreatureType v-model="form.types" />

    <UFormField
      class="col-span-6"
      label="Мировоззрение существа"
      name="alignment"
    >
      <SelectAlignment v-model="form.alignment" />
    </UFormField>

    <CreatureSize v-model="form.sizes" />

    <USeparator>
      <span class="font-bold text-secondary">Статблок</span>
    </USeparator>

    <UFormField
      class="col-span-4"
      label="КД"
      help="Класс доспеха"
      name="ac.value"
    >
      <UInput
        v-model="form.ac.value"
        type="number"
        placeholder="Введи КД"
        min="0"
        step="1"
      />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Текст к КД"
      name="ac.text"
    >
      <UInput
        v-model="form.ac.text"
        placeholder="Введи текст"
      />
    </UFormField>

    <CreatureInitiative
      v-model="form.initiative"
      :dex="form.abilities.dex"
      :proficiency-bonus="form.proficiencyBonus"
      class="col-span-8"
    />

    <CreatureHit
      v-model="form.hit"
      :sizes="form.sizes"
      :constitution="form.abilities.con"
      class="col-span-full"
    />

    <CreatureSpeed v-model="form.speeds" />

    <CreatureAbilities
      v-model="form.abilities"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <CreatureSkills
      v-model="form.skills"
      :abilities="form.abilities"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <CreatureDefenses
      v-model:vulnerabilities="form.vulnerabilities"
      v-model:resistance="form.resistance"
      v-model:immunity-to-damage="form.immunityToDamage"
      v-model:immunity-to-condition="form.immunityToCondition"
    />

    <CreatureSenses
      v-model="form.senses"
      :wisdom="form.abilities.wis"
      :skills="form.skills"
      :proficiency-bonus="form.proficiencyBonus"
    />

    <CreatureLanguages v-model="form.languages" />

    <CreatureChallengeRating
      v-model="form.experience"
      v-model:proficiency-bonus="form.proficiencyBonus"
    />

    <CreatureTrait v-model="form.traits" />

    <CreatureAction
      v-model="form.actions"
      name="actions"
    />

    <CreatureAction
      v-model="form.bonusActions"
      name="bonusActions"
    />

    <CreatureAction
      v-model="form.reactions"
      name="reactions"
    />

    <CreatureAction
      v-model="form.legendaryActions"
      name="legendaryActions"
    />

    <USeparator>
      <span class="font-bold text-secondary">Изображения</span>
    </USeparator>

    <UFormField
      class="col-span-8"
      label="Основное"
      help="Эта картинка отображается при просмотре страницы существа"
      name="image"
    >
      <UploadImage
        v-model="form.image"
        section="bestiary"
        max-size="640"
      >
        <template #preview>
          <NuxtImg
            v-slot="{ src, isLoaded, imgAttrs }"
            :key="form.image"
            :src="form.image"
            custom
          >
            <!-- Show the actual image when loaded -->
            <img
              v-if="isLoaded"
              v-bind="imgAttrs"
              class="w-full rounded-lg object-contain"
              :src="src"
              :alt="form.name.rus"
            />

            <!-- Show a placeholder while loading -->
            <img
              v-else
              class="w-full rounded-lg object-contain"
              src="/img/no-img.webp"
              alt="no image"
            />
          </NuxtImg>
        </template>
      </UploadImage>
    </UFormField>
  </UForm>
</template>
