<script setup lang="ts">
  import { useTokenatorStore } from '../composables';

  import {
    ControlsLibrary,
    ControlsSettings3D,
    ControlsSettingsBase,
    ControlsSettingsStyle,
    ControlsSettingsText,
  } from './ui';

  const store = useTokenatorStore();
  const selectedTab = ref('library');
  const toolTab = ref('base');

  watch(selectedTab, (tab) => {
    if (tab === 'library') {
      toolTab.value = 'base';
    }
  });

  watch(toolTab, (tool) => {
    if (tool !== '3d') {
      store.brush.enabled = false;
    }
  });
</script>

<template>
  <div class="flex flex-col gap-4">
    <UTabs
      v-model="selectedTab"
      :items="[
        { label: 'Библиотека', value: 'library', slot: 'library' as const },
        { label: 'Настройки', value: 'settings', slot: 'settings' as const },
      ]"
      @update:model-value="toolTab = 'base'"
    >
      <template #library>
        <ControlsLibrary />
      </template>

      <template #settings>
        <UTabs
          v-model="toolTab"
          size="sm"
          :items="[
            { label: 'Основа', value: 'base', slot: 'base' as const },
            { label: 'Стиль', value: 'style', slot: 'style' as const },
            { label: '3D', value: '3d', slot: '3d' as const },
            { label: 'Текст', value: 'text', slot: 'text' as const },
          ]"
        >
          <template #base>
            <ControlsSettingsBase />
          </template>

          <template #style>
            <ControlsSettingsStyle />
          </template>

          <template #3d>
            <ControlsSettings3D />
          </template>

          <template #text>
            <ControlsSettingsText />
          </template>
        </UTabs>
      </template>
    </UTabs>
  </div>
</template>
