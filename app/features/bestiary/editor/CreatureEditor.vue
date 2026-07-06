<script setup lang="ts">
  import type { CreatureCreate } from '~bestiary/model';

  import { getInitialState } from '~bestiary/model';
  import { CreaturePreview } from '~bestiary/preview';
  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectAlignment } from '~ui/select';
  import { UploadGallery, UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import {
    CREATURE_GALLERY_FIELD_LABEL,
    CREATURE_IMAGE_SECTION_TITLE,
    CREATURE_UPLOAD_SECTION,
  } from './constants';
  import {
    CreatureAbilities,
    CreatureAction,
    CreatureChallengeRating,
    CreatureDefenses,
    CreatureHit,
    CreatureInitiative,
    CreatureLair,
    CreatureLanguages,
    CreatureLegendaryActions,
    CreatureSection,
    CreatureSenses,
    CreatureSize,
    CreatureSkills,
    CreatureSpeed,
    CreatureTrait,
    CreatureType,
  } from './ui';

  const { state, submitState, onError, onSubmit, revisionControl } =
    useWorkshopForm<CreatureCreate>({
      actionUrl: '/api/v2/bestiary',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.CREATURE,
    });
</script>

<template>
  <UForm
    :state
    class="grid grid-cols-1 gap-6 pb-24 md:grid-cols-24"
    @error="onError"
    @submit="onSubmit"
  >
    <CreatureSection v-model="state.section" />

    <EditorBaseInfo
      v-model="state"
      section="bestiary"
    />

    <UCard
      variant="subtle"
      class="col-span-full"
    >
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <UFormField
        name="description"
        :ui="{ root: 'w-full', container: 'w-full' }"
      >
        <MarkupEditor
          v-model="state.description"
          placeholder="Введи описание"
        />
      </UFormField>
    </UCard>

    <UCard
      variant="subtle"
      class="col-span-full"
    >
      <template #header>
        <h2 class="truncate text-base text-highlighted">Заголовок</h2>
      </template>

      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
          <CreatureType v-model="state.types" />

          <UFormField
            label="Мировоззрение существа"
            class="col-span-full md:col-span-8"
            name="alignment"
          >
            <SelectAlignment v-model="state.alignment" />
          </UFormField>
        </div>

        <CreatureSize v-model="state.sizes" />
      </div>
    </UCard>

    <UCard
      variant="subtle"
      class="col-span-full"
    >
      <template #header>
        <h2 class="truncate text-base text-highlighted">Статблок</h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="col-span-full md:col-span-3"
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
          class="col-span-full md:col-span-13"
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
          class="col-span-full md:col-span-8"
        />

        <CreatureHit
          v-model="state.hit"
          :sizes="state.sizes"
          :constitution="state.abilities.con"
          class="col-span-full"
        />
      </div>
    </UCard>

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

    <UCard
      variant="subtle"
      class="col-span-full"
    >
      <template #header>
        <h2 class="truncate text-base text-highlighted">Снаряжение</h2>
      </template>

      <UFormField
        class="col-span-full md:col-span-13"
        name="ac.text"
      >
        <UInput
          v-model="state.equipments"
          placeholder="Введи снаряжение"
        />
      </UFormField>
    </UCard>

    <CreatureDefenses v-model="state.defenses" />

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

    <UCard
      variant="subtle"
      class="col-span-full"
    >
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ CREATURE_IMAGE_SECTION_TITLE }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="col-span-full md:col-span-8"
          label="Основное"
          help="Эта картинка отображается при просмотре страницы существа"
          name="image"
        >
          <UploadImage
            v-model="state.image"
            :section="CREATURE_UPLOAD_SECTION"
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

        <UFormField
          class="col-span-full md:col-span-16"
          :label="CREATURE_GALLERY_FIELD_LABEL"
          name="gallery"
        >
          <UploadGallery
            v-model="state.gallery"
            :section="CREATURE_UPLOAD_SECTION"
          />
        </UFormField>
      </div>
    </UCard>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <CreaturePreview
          :state="submitState"
          :open="opened"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>

<style scoped>
  :deep([data-slot='root']:has(> textarea[data-slot='base'])) {
    display: flex;
    width: 100%;
  }

  :deep(textarea[data-slot='base']) {
    width: 100%;
  }
</style>
