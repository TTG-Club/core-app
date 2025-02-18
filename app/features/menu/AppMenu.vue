<script setup lang="ts">
  import { SvgLogo, HamburgerIcon } from '~/shared/ui';
  import { PopoverMenu, MenuSection, MenuContacts, MenuSupport } from './ui';

  import { MENU_SUPPORT, MENU_LINKS } from './model';

  const isShowMenu = ref(false);
</script>

<template>
  <PopoverMenu v-model="isShowMenu">
    <template #trigger>
      <HamburgerIcon v-model="isShowMenu" />
    </template>

    <template #default>
      <AFlex
        :class="$style.header"
        gap="middle"
      >
        <NuxtLink
          :class="$style.logo"
          to="/"
        >
          <SvgLogo />
        </NuxtLink>

        <AFlex
          vertical
          justify="space-around"
        >
          <span :class="$style.description">
            Онлайн справочник по D&D 5e 2024
          </span>

          <span :class="$style.title">TTG Club</span>
        </AFlex>
      </AFlex>

      <ADivider :style="{ margin: '12px 0' }" />

      <AFlex
        wrap="wrap"
        gap="40"
        :class="$style.content"
      >
        <MenuSection
          icon="menu/filled/character"
          title="Заголовок"
          :items="[
            { href: '/', label: 'Главная' },
            { href: '/workshop', label: 'Мастерская' },
            { href: '/species', label: 'Виды' },
            { href: '/', label: 'Заклинания' },
          ]"
        />
      </AFlex>

      <ADivider :style="{ margin: '12px 0' }" />

      <AFlex
        :class="$style.footer"
        gap="small"
        wrap="wrap"
      >
        <MenuContacts :social-links="MENU_LINKS" />

        <ADivider
          type="vertical"
          :style="{ height: '32px' }"
        />

        <MenuSupport :support-items="MENU_SUPPORT" />
      </AFlex>
    </template>
  </PopoverMenu>
</template>

<style lang="scss" module>
  .header {
    padding: 24px 24px 12px 24px;
  }

  .logo {
    width: 70px;
    height: 70px;
  }

  .title {
    font-size: 26px;
    font-weight: 600;
    line-height: 36px;
    color: var(--color-text-title);
  }

  .content {
    padding: 12px 16px;
  }

  .footer {
    padding: 0 24px 12px 24px;
  }
</style>
