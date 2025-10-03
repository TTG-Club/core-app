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
  } from './ui';
  import { UiCollapse } from '~ui/collapse';
  import { ClassSubclassesDrawer } from '~classes/subclasses-drawer';

  const { detail, hideGallery = false } = defineProps<{
    detail: ClassDetailResponse;
    hideGallery?: boolean;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(ClassSubclassesDrawer, {
    destroyOnClose: true,
  });

  function openSubclasses(url: string) {
    drawer.open({
      url,
      onClose: () => drawer.close(),
    });
  }
</script>

<template>
  <div class="@container">
    <div class="flex flex-col gap-6 @min-[800px]:flex-row @min-[800px]:gap-7">
      <div class="flex w-full flex-col gap-4 @min-[800px]:max-w-80">
        <UiGallery
          v-if="!hideGallery && detail.image"
          :preview="detail.image"
          :images="[detail.image, ...(detail.gallery || [])]"
        />

        <StatsBlock
          :hit-dice="detail.hitDice"
          :saving-throws="detail.savingThrows"
          :proficiency="detail.proficiency"
          :primary-characteristic="detail.primaryCharacteristic"
        />

        <UButton
          v-if="detail.hasSubclasses"
          block
          @click.left.exact.prevent="openSubclasses(detail.url)"
        >
          Подклассы
        </UButton>
      </div>

      <div class="flex flex-auto flex-col gap-6">
        <ClassTable
          :table="detail.table"
          :caster-type="detail.casterType"
          :features="detail.features"
        />

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
          default-open
        >
          <template #default> Описание</template>

          <template #content>
            <MarkupRender :entries="detail.description" />
          </template>
        </UiCollapse>
      </div>
    </div>
  </div>
</template>
