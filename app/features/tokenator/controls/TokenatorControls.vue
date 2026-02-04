<script setup lang="ts">
  import { useTokenatorStore } from '~tokenator/composables';
  import {
    CANVAS_SIZE,
    DEFAULT_BRUSH_CONFIG,
    DEFAULT_COLORS,
    DEFAULT_FRAME_TINT,
    DEFAULT_TRANSFORM,
    drawToken,
    TokenatorTab,
    TokenatorTool,
  } from '~tokenator/model';

  import {
    ControlsLibrary,
    ControlsSettings3D,
    ControlsSettingsBase,
    ControlsSettingsStyle,
    ControlsSettingsText,
  } from './ui';

  const store = useTokenatorStore();
  const selectedTab = ref(TokenatorTab.Library);
  const toolTab = ref(TokenatorTool.Base);

  const tabs = [
    {
      label: 'Библиотека',
      value: TokenatorTab.Library,
      slot: 'library' as const,
    },
    {
      label: 'Настройки',
      value: TokenatorTab.Settings,
      slot: 'settings' as const,
    },
  ];

  const toolTabs = [
    {
      label: 'Основа',
      value: TokenatorTool.Base,
      slot: 'base' as const,
    },
    {
      label: 'Стиль',
      value: TokenatorTool.Style,
      slot: 'style' as const,
    },
    {
      label: '3D',
      value: TokenatorTool.ThreeD,
      slot: '3d' as const,
    },
    {
      label: 'Текст',
      value: TokenatorTool.Text,
      slot: 'text' as const,
    },
  ];

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
    if (tab === TokenatorTab.Library) {
      toolTab.value = TokenatorTool.Base;
    }
  });

  watch(toolTab, (tool) => {
    if (tool !== TokenatorTool.ThreeD) {
      store.brush.enabled = false;
    }
  });

  const { exportToPng, exportToWebp, isExportingPng, isExportingWebp } =
    useCanvasExport();

  async function downloadToken(format: 'png' | 'webp') {
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

    const filename = `token-${Date.now()}`;

    if (format === 'png') {
      await exportToPng(canvas, filename);
    } else {
      await exportToWebp(canvas, filename);
    }
  }

  function resetTab() {
    switch (toolTab.value) {
      case TokenatorTool.Base:
        store.resetBaseSettings();

        break;
      case TokenatorTool.Style:
        store.resetStyleSettings();

        break;
      case TokenatorTool.ThreeD:
        store.clearMask();

        break;
      case TokenatorTool.Text:
        store.resetTextSettings();

        break;
      default:
        break;
    }
  }

  const resetIcon = computed(() =>
    toolTab.value === TokenatorTool.ThreeD
      ? 'i-fluent-eraser-24-regular'
      : 'i-fluent-arrow-reset-24-regular',
  );

  const resetLabel = computed(() =>
    toolTab.value === TokenatorTool.ThreeD ? 'Стереть маску' : 'Сбросить все',
  );
</script>

<template>
  <div class="grid gap-2">
    <div class="relative">
      <UTabs
        v-model="selectedTab"
        :items="tabs"
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
              :items="toolTabs"
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
                :icon="resetIcon"
                :label="resetLabel"
                size="sm"
                variant="soft"
                color="error"
                block
                @click.left.exact.prevent="resetTab"
              />
            </div>
          </div>
        </template>
      </UTabs>

      <UButton
        v-if="hasSettingsChanged"
        tooltip="Сбросить все настройки"
        icon="i-fluent-arrow-reset-20-regular"
        size="xs"
        color="neutral"
        variant="solid"
        class="absolute top-2 right-2"
        @click.left.exact.prevent="store.resetSettings"
      />
    </div>

    <div class="grid grid-cols-2 gap-2 pt-2">
      <UButton
        icon="i-fluent-arrow-download-24-regular"
        :loading="isExportingPng"
        variant="soft"
        label="PNG"
        block
        @click.left.exact.prevent="downloadToken('png')"
      />

      <UButton
        icon="i-fluent-arrow-download-24-regular"
        :loading="isExportingWebp"
        color="neutral"
        variant="soft"
        label="WEBP"
        block
        @click.left.exact.prevent="downloadToken('webp')"
      />
    </div>
  </div>
</template>
