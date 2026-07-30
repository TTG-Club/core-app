<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import { useVttgDesktopRelease } from '../composables';
  import { formatPlatformLabel, VTTG_DOWNLOAD_PLATFORMS } from '../model';

  /** Кнопка платформы: готовая ведёт на установщик, остальные выключены. */
  interface PlatformAction {
    id: string;
    label: string;
    icon: string;
    color: ButtonProps['color'];
    variant: ButtonProps['variant'];
    to?: string;
    target?: string;
    rel?: string;
    disabled: boolean;
    loading: boolean;
  }

  const { release, error, load } = useVttgDesktopRelease();

  const platformActions = computed<PlatformAction[]>(() =>
    VTTG_DOWNLOAD_PLATFORMS.map((platform) => {
      const label = formatPlatformLabel(platform);

      if (!platform.ready) {
        return {
          id: platform.id,
          label,
          icon: platform.icon,
          color: 'neutral',
          variant: 'subtle',
          disabled: true,
          loading: false,
        };
      }

      const downloadUrl = release.value?.downloadUrl;

      return {
        id: platform.id,
        label,
        icon: platform.icon,
        color: 'primary',
        variant: 'soft',
        to: downloadUrl,
        // Атрибуты ссылки только когда кнопка действительно ссылка: без `to`
        // Nuxt UI рисует `button`, которому `target`/`rel` не нужны.
        target: downloadUrl ? '_blank' : undefined,
        rel: downloadUrl ? 'noopener noreferrer' : undefined,
        // Манифест не отдался — ссылки нет, кнопку гасим, а не ведём в никуда.
        disabled: !downloadUrl && !!error.value,
        // Пока манифест читается, кнопка крутит спиннер: ссылка вот-вот появится.
        loading: !downloadUrl && !error.value,
      };
    }),
  );

  onMounted(load);
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UButton
      v-for="action in platformActions"
      :key="action.id"
      :icon="action.icon"
      :to="action.to"
      :target="action.target"
      :rel="action.rel"
      :color="action.color"
      :variant="action.variant"
      :disabled="action.disabled"
      :loading="action.loading"
      size="xs"
    >
      {{ action.label }}
    </UButton>
  </div>
</template>
