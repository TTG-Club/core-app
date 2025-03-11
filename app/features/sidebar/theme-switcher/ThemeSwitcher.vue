<script setup lang="ts">
  import { SvgIcon } from '~/shared/ui';
  import { useTheme } from '~/shared/composables';
  import { SidebarPopover } from '../popover';
  import { ThemeName } from '~/shared/consts';

  const { themeName, change } = useTheme();

  const isSvifty7ThemeShowed = computed(
    () =>
      themeName.value === ThemeName.Dark ||
      themeName.value === ThemeName.svifty7,
  );

  function getButtonType(name: ThemeName) {
    if (themeName.value === name) {
      return 'primary';
    }

    return 'default';
  }
</script>

<template>
  <SidebarPopover
    popover-key="theme-switcher"
    bottom
  >
    <template #trigger="{ toggle }">
      <AButton
        type="text"
        size="large"
        @click.left.exact.prevent="toggle"
      >
        <template #icon>
          <SvgIcon icon="settings" />
        </template>
      </AButton>
    </template>

    <template #default>
      <AFlex
        :style="{ padding: '12px' }"
        gap="12"
        vertical
      >
        <AFlex
          gap="8"
          vertical
        >
          <span> Переключение темы </span>

          <AFlex gap="8">
            <AButton
              :type="getButtonType(ThemeName.Light)"
              @click.left.exact.prevent="change(ThemeName.Light)"
            >
              Светлая
            </AButton>

            <AButton
              :type="getButtonType(ThemeName.Dark)"
              @click.left.exact.prevent="change(ThemeName.Dark)"
            >
              Темная
            </AButton>
          </AFlex>
        </AFlex>

        <template v-if="isSvifty7ThemeShowed">
          <AFlex
            gap="8"
            vertical
          >
            <span> Сделать, как у <b>svifty7</b> </span>

            <AFlex gap="8">
              <AButton
                :type="getButtonType(ThemeName.Dark)"
                block
                @click.left.exact.prevent="change(ThemeName.Dark)"
              >
                Выкл
              </AButton>

              <AButton
                :type="getButtonType(ThemeName.svifty7)"
                block
                @click.left.exact.prevent="change(ThemeName.svifty7)"
              >
                Вкл
              </AButton>
            </AFlex>
          </AFlex>
        </template>
      </AFlex>
    </template>
  </SidebarPopover>
</template>
