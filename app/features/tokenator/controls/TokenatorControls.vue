<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';
  import { CANVAS_SIZE, drawToken } from '~tokenator/model';

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

  async function downloadToken(format: 'png' | 'jpeg' | 'webp') {
    const canvas = document.createElement('canvas');

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    await drawToken({
      ctx,
      backgroundColor: store.backgroundColor,
      currentImage: store.currentImage,
      activeFrameUrl: store.activeFrameUrl,
      frameTint: store.frameTint,
      transform: store.transform,
      clip: true,
      texts: store.texts,
      customBackground: store.customBackground,
      maskImage: store.maskImageCanvas || undefined,
      maskTokenSize: store.maskTokenSize,
      halfMask: store.brush.halfMask,
    });

    const url = canvas.toDataURL(`image/${format}`, 0.9);
    const link = document.createElement('a');

    link.download = `token-${Date.now()}.${format}`;
    link.href = url;
    link.click();
  }
</script>

<template>
  <div class="grid gap-2">
    <UTabs
      v-model="selectedTab"
      :items="[
        { label: 'Библиотека', value: 'library', slot: 'library' as const },
        { label: 'Настройки', value: 'settings', slot: 'settings' as const },
      ]"
      :ui="{
        root: 'grid gap-2',
      }"
    >
      <template #library>
        <ControlsLibrary />
      </template>

      <template #settings>
        <div class="grid h-full gap-2">
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

          <UButton
            icon="i-fluent-arrow-reset-24-regular"
            label="Сбросить все настройки"
            variant="soft"
            color="error"
            block
            @click="store.resetSettings"
          />
        </div>
      </template>
    </UTabs>

    <USeparator class="py-2" />

    <div class="grid grid-cols-2 gap-2">
      <UButton
        icon="i-fluent-arrow-download-24-regular"
        label="PNG"
        variant="soft"
        block
        @click="downloadToken('png')"
      />

      <UButton
        icon="i-fluent-arrow-download-24-regular"
        color="neutral"
        variant="soft"
        label="WEBP"
        block
        @click="downloadToken('webp')"
      />
    </div>
  </div>
</template>
