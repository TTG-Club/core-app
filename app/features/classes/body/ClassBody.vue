<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';
  import { UiGallery } from '~ui/gallery';

  import type { ClassDetailResponse } from '~classes/types';
  import {
    ClassEquipment,
    ClassProficiency,
    ClassTable,
    FeatureCollapse,
    StatsBlock,
    ClassRouting,
  } from './ui';
  import { UiCollapse } from '~ui/collapse';

  const { detail, hideGallery = false } = defineProps<{
    detail: ClassDetailResponse;
    hideGallery?: boolean;
  }>();
</script>

<template>
  <div class="@container">
    <div class="flex flex-col gap-6 @min-[800px]:flex-row @min-[800px]:gap-7">
      <div class="flex w-full flex-shrink-0 flex-col gap-4 @min-[800px]:w-80">
        <UiGallery
          v-if="!hideGallery && detail.image"
          :preview="detail.image"
          :images="[detail.image, ...(detail.gallery || [])]"
        />

        <StatsBlock
          :hit-dice="detail.hitDice"
          :saving-throws="detail.savingThrows"
          :proficiency="detail.proficiency"
          :primary-characteristics="detail.primaryCharacteristics"
        />
      </div>

      <div class="flex flex-auto flex-col gap-6">
        <div class="flex flex-col gap-2">
          <ClassRouting
            :url="detail.url"
            :name="detail.name"
            :parent="detail.parent"
            :has-description="!!detail.description"
          />

          <ClassTable
            :table="detail.table"
            :caster-type="detail.casterType"
            :features="detail.features"
          />
        </div>

        <ClassProficiency
          :proficiency="detail.proficiency"
          :saving-throws="detail.savingThrows"
        />

        <ClassEquipment :equipment="detail.equipment" />

        <FeatureCollapse
          v-for="feature in detail.features"
          :key="feature.key"
          :feature
        />

        <UiCollapse
          v-if="detail.description?.length"
          id="description"
          default-open
        >
          <template #default>Описание</template>

          <template #content>
            <MarkupRender :entries="detail.description" />
          </template>
        </UiCollapse>
      </div>
    </div>
  </div>
</template>
