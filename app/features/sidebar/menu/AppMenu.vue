<script setup lang="ts">
  import { SvgLogo, HamburgerIcon } from '~/shared/ui';
  import { MenuSection, MenuContacts, MenuSupport } from './ui';
  import { MENU_SUPPORT, MENU_LINKS } from './model';
  import { SidebarPopover } from '../popover';
</script>

<template>
  <SidebarPopover popover-key="app-menu">
    <template #trigger="{ isOpened, toggle }">
      <HamburgerIcon
        :is-active="isOpened"
        @click.left.exact.prevent="toggle"
      />
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
        gap="20"
        :class="$style.content"
      >
        <MenuSection
          icon="menu/filled/character"
          title="Персонаж"
          :items="[
            { href: '/', label: 'Классы', disabled: true },
            { href: '/species', label: 'Виды' },
            { href: '/', label: 'Черты', disabled: true },
            { href: '/', label: 'Предыстории', disabled: true },
            { href: '/spells', label: 'Заклинания' },
          ]"
        />

        <MenuSection
          icon="menu/filled/inventory"
          title="Предметы"
          :items="[
            { href: '/', label: 'Снаряжение', disabled: true },
            { href: '/', label: 'Магические предметы', disabled: true },
          ]"
        />

        <MenuSection
          icon="menu/filled/workshop"
          title="Мастерская"
          :items="[
            { href: '/', label: 'Бестиарий', disabled: true },
            { href: '/', label: 'Справочник', disabled: true },
            { href: '/', label: 'Источники', disabled: true },
          ]"
        />

        <MenuSection
          icon="menu/filled/wiki"
          title="Интрукции"
          :items="[
            { href: '/', label: 'Discord Bot', disabled: true },
            { href: '/', label: 'Telegram Spell Bot', disabled: true },
            { href: '/', label: 'Управление закладками', disabled: true },
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
  </SidebarPopover>
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
