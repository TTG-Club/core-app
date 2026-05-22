<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { LayoutWidthName, ThemeName } from '~/shared/consts';

  import {
    DISPLAY_SETTINGS_ARIA,
    LAYOUT_WIDTH_OPTIONS,
    LAYOUT_WIDTH_SECTION_TITLE,
    THEME_OPTIONS,
    THEME_SECTION_TITLE,
  } from './constants';

  const { name: themeName, change: changeTheme } = useTheme();
  const { width: layoutWidth, change: changeLayoutWidth } = useLayoutWidth();
  const { greaterOrEqual } = useBreakpoints();

  const isMenuOnLeft = greaterOrEqual(Breakpoint.MD);

  const side = computed(() => (isMenuOnLeft.value ? 'right' : 'top'));

  /**
   * Устанавливает тему оформления сайта.
   * @param theme - Выбранная тема оформления.
   */
  function handleThemeChange(theme: ThemeName): void {
    changeTheme(theme);
  }

  /**
   * Устанавливает ширину макета сайта.
   * @param width - Выбранная ширина макета.
   */
  function handleLayoutWidthChange(width: LayoutWidthName): void {
    changeLayoutWidth(width);
  }

  const items = computed<DropdownMenuItem[][]>(() => [
    [
      {
        label: THEME_SECTION_TITLE,
        type: 'label' as const,
      },
      ...THEME_OPTIONS.map((option) => ({
        label: option.label,
        icon: option.icon,
        type: 'checkbox' as const,
        checked: themeName.value === option.value,
        onSelect: (event: Event) => {
          event.preventDefault();
          handleThemeChange(option.value);
        },
      })),
    ],
    [
      {
        label: LAYOUT_WIDTH_SECTION_TITLE,
        type: 'label' as const,
      },
      ...LAYOUT_WIDTH_OPTIONS.map((option) => ({
        label: option.label,
        icon: option.icon,
        type: 'checkbox' as const,
        checked: layoutWidth.value === option.value,
        onSelect: (event: Event) => {
          event.preventDefault();
          handleLayoutWidthChange(option.value);
        },
      })),
    ],
  ]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ side, align: 'start', sideOffset: 8 }"
    :ui="{
      content: 'w-56',
    }"
  >
    <UButton
      variant="ghost"
      size="xl"
      icon="tabler:settings"
      color="neutral"
      :aria-label="DISPLAY_SETTINGS_ARIA"
    />
  </UDropdownMenu>
</template>
