<script setup lang="ts">
  import type { ListView } from '~infrastructure/list-presentation/composable';

  import { LayoutWidthName, ThemeName } from '~/shared/consts';
  import { useListView } from '~infrastructure/list-presentation/composable';
  import { LIST_VIEW_OPTIONS } from '~infrastructure/list-presentation/model';

  import { DisplaySettingsChoice } from './choice';
  import { useSectionLayout } from './composables';
  import {
    APPEARANCE_GROUP_TITLE,
    DISPLAY_SETTINGS_ARIA,
    LIST_VIEW_SETTING_TITLE,
    SECTION_LAYOUT_OPTIONS,
    SECTION_LAYOUT_SETTING_TITLE,
    SECTION_LAYOUT_UNAVAILABLE_HINT,
    SECTIONS_GROUP_TITLE,
    THEME_OPTIONS,
    THEME_SECTION_TITLE,
  } from './constants';
  import { DisplaySettingsCustomTheme } from './custom-theme';
  import { DisplaySettingsLayoutPreview } from './layout-preview';
  import { DisplaySettingsListPreview } from './list-preview';

  const { name: themeName, change: changeTheme } = useTheme();
  const { view: listView, setView: setListView } = useListView();

  const { greaterOrEqual, isLgOrGreater } = useBreakpoints();
  const isMounted = useMounted();

  const isMenuOnLeft = greaterOrEqual(Breakpoint.MD);

  const side = computed(() => (isMenuOnLeft.value ? 'right' : 'top'));

  // Колонки рядом бывают только на широком экране: на узком такие раскладки
  // гаснут, а не прячутся — видно, что они есть.
  const isWideAvailable = computed(
    () => isMounted.value && isLgOrGreater.value,
  );

  const layoutHint = computed(() =>
    isWideAvailable.value ? undefined : SECTION_LAYOUT_UNAVAILABLE_HINT,
  );

  const layoutOptions = computed(() =>
    SECTION_LAYOUT_OPTIONS.map((option) => ({
      ...option,
      disabled: option.width === LayoutWidthName.Wide && !isWideAvailable.value,
    })),
  );

  const theme = computed({
    get: () => themeName.value,
    set: (value: ThemeName) => changeTheme(value),
  });

  const isCustomTheme = computed(() => themeName.value === ThemeName.Custom);

  const layout = useSectionLayout();

  const view = computed({
    get: () => listView.value,
    set: (value: ListView) => setListView(value),
  });
</script>

<template>
  <UPopover :content="{ side, align: 'start', sideOffset: 8 }">
    <UButton
      variant="ghost"
      size="xl"
      icon="tabler:settings"
      color="neutral"
      :aria-label="DISPLAY_SETTINGS_ARIA"
    />

    <template #content>
      <div class="flex w-104 flex-col gap-4 p-3">
        <section class="flex flex-col gap-3">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ APPEARANCE_GROUP_TITLE }}
          </h3>

          <DisplaySettingsChoice
            v-model="theme"
            :title="THEME_SECTION_TITLE"
            :options="THEME_OPTIONS"
            shape="pill"
          />

          <DisplaySettingsCustomTheme v-if="isCustomTheme" />
        </section>

        <USeparator />

        <section class="flex flex-col gap-3">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ SECTIONS_GROUP_TITLE }}
          </h3>

          <DisplaySettingsChoice
            v-model="layout"
            :title="SECTION_LAYOUT_SETTING_TITLE"
            :options="layoutOptions"
            :hint="layoutHint"
          >
            <template #preview="{ option }">
              <DisplaySettingsLayoutPreview
                :filters="option.filters"
                :detail="option.detail"
                :overlay="option.width !== LayoutWidthName.Wide"
                :centered="option.centered"
              />
            </template>
          </DisplaySettingsChoice>

          <DisplaySettingsChoice
            v-model="view"
            :title="LIST_VIEW_SETTING_TITLE"
            :options="LIST_VIEW_OPTIONS"
          >
            <template #preview="{ option }">
              <DisplaySettingsListPreview :columns="option.columns" />
            </template>
          </DisplaySettingsChoice>
        </section>
      </div>
    </template>
  </UPopover>
</template>
