<script setup lang="ts">
  import { UiCollapse } from '~ui/collapse';
  import { UiGallery } from '~ui/gallery';
  import { MarkupRender } from '~ui/markup';

  import {
    ClassEquipment,
    ClassProficiency,
    ClassRouting,
    ClassTable,
    FeatureCollapse,
    StatsBlock,
  } from './ui';

  import type { ClassDetailResponse } from '~classes/types';

  const {
    detail,
    hideGallery = false,
    inDrawer = false,
  } = defineProps<{
    detail: ClassDetailResponse;
    hideGallery?: boolean;
    inDrawer?: boolean;
  }>();
</script>

<template>
  <div class="@container">
    <div class="flex flex-col gap-6 @min-3xl:flex-row @min-3xl:gap-7">
      <div
        :class="[
          'flex w-full flex-shrink-0 flex-col gap-4',
          '@min-xl:@max-3xl:flex-row @min-3xl:w-80',
        ]"
      >
        <UiGallery
          v-if="!hideGallery && detail.image"
          :preview="detail.image"
          :images="[detail.image, ...(detail.gallery || [])]"
          class="min-w-25 @min-xl:@max-3xl:max-w-50"
        />

        <StatsBlock
          :hit-dice="detail.hitDice"
          :saving-throws="detail.savingThrows"
          :proficiency="detail.proficiency"
          :primary-characteristics="detail.primaryCharacteristics"
        />
      </div>

      <div class="flex min-w-0 flex-auto flex-col gap-6">
        <div class="flex min-w-0 flex-col gap-2">
          <ClassRouting
            v-if="!inDrawer"
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
          v-if="detail.description"
          id="description"
          default-open
        >
          <template #default>Описание</template>

          <template #content>
            <MarkupRender :render-node="detail.description" />
          </template>
        </UiCollapse>
      </div>
    </div>
  </div>
</template>
