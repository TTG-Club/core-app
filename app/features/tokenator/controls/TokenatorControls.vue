<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';
  import {
    CANVAS_SIZE,
    DEFAULT_BRUSH_CONFIG,
    DEFAULT_COLORS,
    DEFAULT_FRAME_TINT,
    DEFAULT_TRANSFORM,
    drawToken,
  } from '~tokenator/model';

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

  const hasSettingsChanged = computed(() => {
    // Проверяем, отличаются ли текущие настройки от дефолтных
    const hasTransformChanges =
      JSON.stringify(store.transform) !== JSON.stringify(DEFAULT_TRANSFORM);

    const hasColorChanges = store.backgroundColor !== DEFAULT_COLORS.BACKGROUND;

    const hasTintChanges =
      JSON.stringify(store.frameTint) !== JSON.stringify(DEFAULT_FRAME_TINT);

    const hasTextChanges = store.texts.length > 0;

    const hasBrushChanges =
      JSON.stringify(store.brush) !== JSON.stringify(DEFAULT_BRUSH_CONFIG);

    return (
      hasTransformChanges ||
      hasColorChanges ||
      hasTintChanges ||
      hasTextChanges ||
      hasBrushChanges
    );
  });

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
      backgroundStyle: store.backgroundStyle,
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
    <div class="relative">
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

            <div class="flex pt-2">
              <UButton
                :icon="
                  toolTab === '3d'
                    ? 'i-fluent-eraser-20-regular'
                    : 'i-fluent-arrow-reset-20-regular'
                "
                :label="toolTab === '3d' ? 'Стереть маску' : 'Сбросить все'"
                size="sm"
                variant="soft"
                color="error"
                @click="
                  toolTab === 'base'
                    ? store.resetBaseSettings()
                    : toolTab === 'style'
                      ? store.resetStyleSettings()
                      : toolTab === '3d'
                        ? store.clearMask()
                        : store.resetTextSettings()
                "
              />
            </div>
          </div>
        </template>
      </UTabs>

      <UButton
        v-if="hasSettingsChanged"
        v-tooltip="'Сбросить все настройки'"
        icon="i-fluent-arrow-reset-20-regular"
        size="xs"
        color="neutral"
        variant="solid"
        :padded="false"
        class="absolute top-2 right-2"
        @click="store.resetSettings"
      />
    </div>

    <div class="grid grid-cols-2 gap-2 pt-2">
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
