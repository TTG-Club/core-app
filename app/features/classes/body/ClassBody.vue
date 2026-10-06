<script setup lang="ts">
  import type { ClassDetailResponse } from '../model';

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

  const {
    detail,
    hideGallery = false,
    navigateInPlace = false,
    inSplit = false,
    hideNavigation = false,
  } = defineProps<{
    detail: ClassDetailResponse;
    hideGallery?: boolean;

    /** Скрывает переходы к классу и подклассам (предпросмотр из листа). */
    hideNavigation?: boolean;
    /**
     * Включает inline-навигацию внутри текущего контейнера (drawer).
     */
    navigateInPlace?: boolean;
    /**
     * Отображается в сплит-панели (режиме просмотра во всю ширину).
     */
    inSplit?: boolean;
  }>();

  const emit = defineEmits<{
    /**
     * Навигация к другому классу/подклассу внутри текущего контейнера.
     */
    (event: 'navigate', classUrl: string): void;
  }>();
</script>

<template>
  <div class="@container">
    <div class="flex flex-col gap-6 @min-3xl:flex-row @min-3xl:gap-7">
      <div
        class="flex w-full flex-col gap-4 @min-xl:@max-3xl:flex-row @min-3xl:max-w-80 @min-3xl:min-w-68"
      >
        <UiGallery
          v-if="!hideGallery && detail.image"
          class="min-w-25 shrink-0 @min-xl:@max-3xl:w-50"
          :preview="detail.image"
          :images="detail.gallery"
        />

        <StatsBlock
          :hit-dice="detail.hitDice"
          :saving-throws="detail.savingThrows"
          :primary-characteristics="detail.primaryCharacteristics"
        />
      </div>

      <div class="flex min-w-0 flex-auto flex-col gap-6">
        <div class="flex min-w-0 flex-col gap-2">
          <ClassRouting
            :url="detail.url"
            :name="detail.name"
            :parent="detail.parent"
            :has-description="!!detail.description"
            :has-spells="detail.casterType !== 'NONE'"
            :navigate-in-place="navigateInPlace"
            :in-split="inSplit"
            :hide-navigation="hideNavigation"
            @navigate="emit('navigate', $event)"
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

        <div
          v-if="detail.description"
          id="description"
        >
          <UiCollapse default-open>
            <template #default>Описание</template>

            <template #content>
              <MarkupRender :render-node="detail.description" />
            </template>
          </UiCollapse>
        </div>
      </div>
    </div>
  </div>
</template>
