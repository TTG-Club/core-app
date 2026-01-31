<script setup lang="ts">
  import { SidebarPopover } from '~sidebar/popover';
  import { HamburgerIcon, SvgLogo } from '~ui/icon';

  import { MENU_LINKS, MENU_SECTIONS, MENU_SUPPORT } from './model';
  import { MenuContacts, MenuSection, MenuSupport } from './ui';
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
      <div class="flex gap-4 p-6 pb-3">
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
      </div>

      <USeparator class="my-3" />

      <div
        class="flex flex-wrap gap-5"
        :class="$style.content"
      >
        <MenuSection
          v-for="section in MENU_SECTIONS"
          :key="section.label"
          v-bind="section"
        />
      </div>

      <USeparator class="my-3" />

      <div :class="$style.footer">
        <div :class="$style.contacts">
          <MenuContacts :social-links="MENU_LINKS" />

          <USeparator
            :class="$style.divider"
            orientation="vertical"
            class="my-3 h-8"
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
    color: var(--ui-text-highlighted);

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
