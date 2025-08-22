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

  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { SelectAlignment } from '~ui/select';
  import { UploadImage } from '~ui/upload';

  import {
    type CreatureCreate,
    type CreatureDetailResponse,
    getInitialState,
  } from '~bestiary/types';
  import { CreaturePreview } from '~bestiary/preview';
  import { CreatureLair, CreatureLegendaryActions } from '~bestiary/editor/ui';

  const formRef = useTemplateRef('formRef');

  const validate = () => {
    return formRef.value?.validate();
  };

  defineExpose({
    validate,
  });

  const {
    state,
    preview,
    isPreviewShowed,
    isPreviewLoading,
    isPreviewError,
    onError,
    onSubmit,
    showPreview,
  } = await useWorkshopForm<CreatureCreate, CreatureDetailResponse>(
    computed(() => ({
      actionUrl: '/api/v2/bestiary',
      getInitialState,
    })),
  );
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid grid-cols-24 gap-4"
    @error="onError"
    @submit="onSubmit"
  >
    <CreatureSection v-model="state.section" />

    <EditorBaseInfo
      v-model="state"
      section="bestiary"
    />

    <UFormField
      class="col-span-24"
      label="Описание"
      name="description"
    >
      <UTextarea
        v-model="state.description"
        :rows="4"
        placeholder="Введи описание"
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Заголовок</span>
    </USeparator>

    <CreatureType v-model="state.types" />

    <UFormField
      class="col-span-6"
      label="Мировоззрение существа"
      name="alignment"
    >
      <SelectAlignment v-model="state.alignment" />
    </UFormField>

    <CreatureSize v-model="state.sizes" />

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
        v-model="state.ac.value"
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
        v-model="state.ac.text"
        placeholder="Введи текст"
      />
    </UFormField>

    <CreatureInitiative
      v-model="state.initiative"
      :dex="state.abilities.dex"
      :proficiency-bonus="state.proficiencyBonus"
      class="col-span-8"
    />

    <CreatureHit
      v-model="state.hit"
      :sizes="state.sizes"
      :constitution="state.abilities.con"
      class="col-span-full"
    />

    <CreatureSpeed v-model="state.speeds" />

    <CreatureAbilities
      v-model="state.abilities"
      :proficiency-bonus="state.proficiencyBonus"
    />

    <CreatureSkills
      v-model="state.skills"
      :abilities="state.abilities"
      :proficiency-bonus="state.proficiencyBonus"
    />

    <CreatureDefenses
      v-model:vulnerabilities="state.vulnerabilities"
      v-model:resistance="state.resistance"
      v-model:immunity-to-damage="state.immunityToDamage"
      v-model:immunity-to-condition="state.immunityToCondition"
    />

    <CreatureSenses
      v-model="state.senses"
      :wisdom="state.abilities.wis"
      :skills="state.skills"
      :proficiency-bonus="state.proficiencyBonus"
    />

    <CreatureLanguages v-model="state.languages" />

    <CreatureChallengeRating
      v-model="state.experience"
      v-model:proficiency-bonus="state.proficiencyBonus"
    />

    <CreatureTrait v-model="state.traits" />

    <CreatureAction
      v-model="state.actions"
      name="actions"
    />

    <CreatureAction
      v-model="state.bonusActions"
      name="bonusActions"
    />

    <CreatureAction
      v-model="state.reactions"
      name="reactions"
    />

    <CreatureLegendaryActions v-model="state.legendary" />

    <CreatureLair v-model="state.lair" />

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
        v-model="state.image"
        section="bestiary"
        max-size="1024"
      >
        <template #preview>
          <NuxtImg
            v-slot="{ src, isLoaded, imgAttrs }"
            :key="state.image"
            :src="state.image"
            custom
          >
            <!-- Show the actual image when loaded -->
            <img
              v-if="isLoaded"
              v-bind="imgAttrs"
              class="w-full rounded-lg object-contain"
              :src="src"
              :alt="state.name.rus"
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

    <EditorFormControls @preview="showPreview" />
  </UForm>

  <CreaturePreview
    v-model="isPreviewShowed"
    :creature="preview"
    :is-loading="isPreviewLoading"
    :is-error="isPreviewError"
  />
</template>
