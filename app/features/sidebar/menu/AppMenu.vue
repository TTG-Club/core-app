<script setup lang="ts">
  import { MENU_SUPPORT, MENU_LINKS, MENU_SECTIONS } from './model';
  import { MenuSection, MenuContacts, MenuSupport } from './ui';

  import { SidebarPopover } from '~sidebar/popover';
  import { HamburgerIcon, SvgLogo } from '~ui/icon';
</script>

<template>
  <SidebarPopover
    popover-key="app-menu"
    is-menu
  >
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

        <div :class="$style.name">
          <span :class="$style.description">
            Онлайн справочник по D&D 5e 2024
          </span>

          <span :class="$style.title">TTG Club</span>
        </div>
      </AFlex>

      <ADivider :style="{ margin: '12px 0' }" />

      <AFlex
        wrap="wrap"
        gap="20"
        :class="$style.content"
      >
        <MenuSection
          v-for="section in MENU_SECTIONS"
          :key="section.label"
          v-bind="section"
        />
      </AFlex>

      <ADivider :style="{ margin: '12px 0' }" />

      <div :class="$style.footer">
        <div :class="$style.contacts">
          <MenuContacts :social-links="MENU_LINKS" />

          <ADivider
            :style="{ height: '32px' }"
            :class="$style.divider"
            type="vertical"
          />

          <MenuSupport :support-items="MENU_SUPPORT" />
        </div>
      </div>
    </template>
  </SidebarPopover>
</template>

<style lang="scss" module>
  .header {
    padding: 24px 24px 12px 24px;
  }

  .logo {
    width: 33%;
    max-width: 100px;
  }

  .name {
    container-type: inline-size;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
    justify-content: center;
  }

  .title {
    font-size: 28px;
    font-weight: 600;
    line-height: 28px;
    color: var(--color-text-title);

    @container (width >= 248px) {
      font-size: 40px;
      font-weight: 600;
      line-height: 36px;
    }
  }

  .content {
    padding: 12px 16px;
  }

  .footer {
    container-type: inline-size;
  }

  .contacts {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 12px;

    padding: 0 24px 12px 24px;

    @container (width >= 640px) {
      flex-direction: row;
    }

    .divider {
      display: none;

      @container (width >= 592px) {
        display: inline-block;
      }
    }
  }
</style>
