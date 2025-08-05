<script setup lang="ts">
  import { useGlobalSearch } from '../model/composable';
  import { getPathBySearchItem, getTypeNameBySearchItem } from '../model/utils';
  import { GroupTag } from '~/shared/ui/source-tag';

  const { isOpen, loading, data, searchTerm, close } = await useGlobalSearch();

  function onSelect() {
    searchTerm.value = '';
    close();
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    class="top-16 translate-y-0"
  >
    <template #content>
      <UCommandPalette
        ref="modalRef"
        v-model:open="isOpen"
        v-model:search-term="searchTerm"
        placeholder="Введите запрос..."
        :groups="[
          {
            id: 'search',
            label: 'Результаты',
            items: data?.result.map((x) => ({
              label: `${x.name.rus}&[${x.name.eng}]`,
              labelRus: x.name.rus,
              labelEng: `[${x.name.eng}]`,
              typeName: getTypeNameBySearchItem(x.type),
              source: {
                label: x.source.name.label,
                rus: x.source.name.rus,
              },
              to: `/${getPathBySearchItem(x.type)}/${x.url}`,
            })),
          },
        ]"
        :loading="loading"
        @update:model-value="onSelect"
      >
        <template #item="{ item }">
          <div class="flex size-full flex-col gap-1">
            <div class="flex items-center gap-1">
              <span>{{ item.labelRus }}</span>

              <span :class="$style['secondary-color']">{{
                item.labelEng
              }}</span>
            </div>

            <div class="flex items-center gap-1">
              <GroupTag
                v-if="item.source"
                :group="item.source"
              />

              <i
                class="source-name text-xs"
                :class="$style['secondary-color']"
                >{{ item.typeName }}</i
              >
            </div>
          </div>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>

<style module lang="scss">
  .secondary-color {
    color: var(--ui-secondary);
  }
</style>
